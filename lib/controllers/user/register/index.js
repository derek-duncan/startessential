'use strict';

const _ = require('lodash');
const constants = require('lib/constants');
const async = require('async');
const mongoose = require('mongoose');
const moment = require('moment');
const Boom = require('boom');
const Joi = require('joi');
const UtilImage = require('lib/util/image');
const UtilUser = require('lib/controllers/user/util');
const _message = require('lib/util/createMessage');

const User = mongoose.model('User');
const Email = require('lib/util/email');
const stripe = require('stripe')(constants.STRIPE_KEY);

module.exports = {
  preCreateUserAccountSetup: preCreateUserAccountSetup,
  createUserAccount: createUserAccount,
  completeUserAccount: completeUserAccount
}

function preCreateUserAccountSetup(request, reply) {
  var payload = request.payload;
  async.waterfall([
    function(done) {
      var state = {
        memberNumber: payload.memberNumber,
        termsAgree: payload.termsAgree,
        coupon: payload.coupon
      }
      var schema = {
        memberNumber: Joi.number(),
        termsAgree: Joi.string().allow('agree').required(),
        coupon: Joi.optional()
      }
      Joi.validate(state, schema, function(err, value) {
        if (err) {
          var message = '';
          err.details.forEach(function(detail) {
            switch (detail.path) {
              case 'termsAgree':
                message = 'You must read and agree to the terms of service';
                break;
              case 'memberNumber':
                message = 'Please enter a valid member number';
                break;
              default:
                message = 'Please review your information and correct any errors'
                break;
            }
          })
          message = _message(message);
          message += '&se_member_number=' + payload.memberNumber;
          return reply.redirect('/register' + message)
        }
        return done(null, state)
      })
    }
  ], function(err, state) {
    return reply.redirect('/facebook/register').state('se_register', state)
  })
}

function createUserAccount(request, reply) {
  var profile = request.auth.credentials.profile;
  var preRegisterInfo = request.state.se_register ? request.state.se_register : null;

  async.waterfall([

    // #### Setup intial user object to customize later #####

    function(done) {
      User.findOne({email: profile.email}, function(err, user) {
        if (err) return reply(Boom.wrap(err, 500))
        if (!user) {
          var newUser = new User({
            email: profile.email,
            first_name: profile.name.first,
            last_name: profile.name.last,
            facebook_connected: true,
            facebook_id: profile.id,
            member_number: preRegisterInfo.memberNumber
          })
          async.parallel({
            addEmail: function(done) {
              var mailchimp_user = {
                email: newUser.email,
                name: {
                  first: newUser.first_name,
                  last: newUser.last_name
                }
              }
              Email.save(mailchimp_user, constants.EMAIL_LIST.USERS, function(err) {
                if (err) request.log(['error', 'email', 'save'], err);
                return done()
              })
            },
            createEmblem: function(done) {

              const utilUser = new UtilUser();
              let emblem = utilUser.createEmblem({
                name: newUser.full_name,
                memberNumber: newUser.member_number
              });
              emblem.then(emblemDetails => {
                return done(emblemDetails);
              }).catch(err => {
                return done(err);
              });
            }
          }, function(err, results) {
            return done(null, newUser, { isNew: true, emblem: results.createEmblem })
          })
        } else {
          return done(null, user, { isNew: false })
        }
      })
    },

    // #### Check for referral links and rewards users ######

    function(user, userExtras, done) {
      if (userExtras.isNew) {
        // If they signed up through a referall link, reward the appropriate referrer
        if (request.state.friend) {
          User.findOne({ referral_id: request.state.friend }, function(err, friend_user) {
            if (err) return done(Boom.wrap(err, 500))
            // if the friend doesnt exist, just create a new account
            if (!friend_user) return done(null, user, userExtras)

            user.friend = friend_user._id;

            friend_user.friends.push(user._id);
            if (friend_user.friends.length % 3 === 0) {
              friend_user.addFree30Days();
              var emailTemplate = require('lib/util/email/templates/referral-reward');
              emailTemplate.locals = {
                email: friend_user.email,
                fname: friend_user.first_name
              }
              Email.send(emailTemplate)
            }
            friend_user.save(function(err) {
              if (err) return done(Boom.wrap(err, 500))
              return done(null, user, userExtras);
            })
          })
        // If they signed up organically, pass the process on
        } else {
          return done(null, user, userExtras)
        }
      // If they signed up organically, pass the process on
      } else {
        return done(null, user, userExtras)
      }

    // #### Create stripe customer ##############

    }, function(user, userExtras, done) {
      var stripeData = {
        plan: constants.SUBSCRIPTIONS.TIER_1.NAME,
        email: user.email
      };
      if (preRegisterInfo.coupon) {
        stripeData.coupon = preRegisterInfo.coupon
      };

      async.waterfall([
        function(done) {
          // If the user exists in stripe already, end their trial so they don't "play the system" and use the existing object
          if (user.stripe.id) {
            stripeData.trial_end = 'now';
            stripe.customers.retrieve( user.stripe.id, function(err, customer) {
              if (customer && customer.deleted) {
                stripe.customers.create(stripeData, function(err, customer) {
                  if (err) return done(boom.badimplementation())
                  return done(null, customer)
                })
              } else {
                stripe.customers.update( user.stripe.id, stripeData, function(err, customer) {
                  if (err) return done(Boom.badImplementation('', err))
                  return done(null, customer)
                });
              }
            })
          } else {
            stripe.customers.create(stripeData, function(err, customer) {
              if (err) return done(Boom.badImplementation('', err))
              return done(null, customer)
            })
          }
        },
        function(customer, done) {
          if (userExtras.isNew) {
            user.stripe.date = Date.now();
          }
          user.stripe.id = customer.id;
          user.stripe.subscription = customer.subscriptions.data[0].plan.id
          user.stripe.subscription_id = customer.subscriptions.data[0].id
          user.records.week_renew_date = moment().add(1, 'week').unix()
          user.records.month_renew_date = customer.subscriptions.data[0].current_period_end
          user.records.downloads = 2;
          user.records.downloaded = 0;
          return done();
        }
      ], function(err) {
        return done(null, user, userExtras)
      });

    // #### Setup our side of the user and save ##############

    }, function(user, userExtras, done) {
      user.logged_in = true
      if (userExtras.isNew) {
        var emailTemplate = require('lib/util/email/templates/welcome-email');
        emailTemplate.locals = {
          email: user.email,
          fname: user.first_name
        }
        Email.send(emailTemplate)

        user.emblem = userExtras.emblem;
        user.token = request.auth.credentials.token;
        user.deleted = false; // just incase they are reactivating their account
        user.createUserToken()
        user.save(function(err) {
          if (err) return reply(Boom.wrap(err, 500))
          request.auth.session.set(user);
          console.log(user)
          return reply.redirect('/thankyou').unstate('friend');
        })
      } else {
        request.auth.session.set(user);
        return reply.redirect('/facebook/login')
      }
    }
  ])
}

function completeUserAccount(request, reply) {
  if (request.method === 'get') {
    var user_id = request.state.sid._id;
    async.waterfall([
      function(done) {
        User.findOne( { _id: user_id } ).lean().exec(function(err, user) {
          if (err) return done(Boom.wrap(err, 500));
          if (user.scope === constants.SCOPE.AUTHENTICATED) {
            return reply.redirect('/login')
          }

          stripe.customers.retrieve( user.stripe.id, function(err, customer) {
            if (err) return done(Boom.wrap(err, 500));

            var planAmount = customer.subscriptions.data[0].plan.amount;
            var finalAmount;
            if (customer.discount && customer.discount.coupon ) {
              var coupon = customer.discount.coupon;
              if ( coupon.percent_off ) {
                var percent = coupon.percent_off / 100;
                finalAmount = planAmount - ( planAmount * percent );
              }
              if ( coupon.amount_off ) {
                finalAmount = planAmount - coupon.amount_off;
              }
              return done(null, finalAmount);
            }
            return done(null, planAmount);
          });

        });
      }
    ], function(err, amount ) {
      return reply.view('core/register_finish', {
        title: 'Register for Start Essential',
        email: request.state.sid.email,
        amount: amount
      });
    })
  }
  if (request.method === 'post') {
    var preRegisterInfo = request.state.se_register ? request.state.se_register : null;

    User.findOne({ _id: request.state.sid._id }).exec(function(err, user) {
      if (err) return reply(Boom.wrap(err, 500))
      if (!user) return reply(Boom.unauthorized('You must have an user account to setup payment'))

      var stripeData = {
        source: request.payload.stripeToken
      };

      stripe.customers.update( user.stripe.id, stripeData, function(err, customer) {
        if (err) {
          request.log(['error', 'registration'], err)
          return reply.redirect('/register/finish' + _message('There was an error while creating your account. Please contact us for assistance.'))
        }

        user.stripe.trial_expired = false;
        user.scope = constants.SCOPE.AUTHENTICATED;
        user.save(function() {
          request.auth.session.set(user)
          return reply.redirect('/posts').unstate('se_register')
        });
      });
    })
  }
}

