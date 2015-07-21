var _ = require('lodash')
var constants = require('lib/constants')
var async = require('async')
var mongoose = require('mongoose')
var moment = require('moment')
var Boom = require('boom')
var Joi = require('joi')
var Upload = require('lib/util/image')
var _message = require('lib/util/createMessage')

var User = mongoose.model('User');
var Email = require('lib/util/email');
var stripe = require('stripe')(constants.STRIPE_KEY);

module.exports = {
  pre: pre,
  init: init,
  finalize: finalize
}

function pre(request, reply) {
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

function init(request, reply) {
  var profile = request.auth.credentials.profile;
  var preRegisterInfo = request.state.se_register ? request.state.se_register : null;

  async.waterfall([
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
              var newUpload = new Upload({
                filename: newUser.first_name.toLowerCase() + '.png'
              });
              var emblemOptions = {
                text: newUser.member_number
              };
              newUpload.createUserEmblem(emblemOptions, done)
            }
          }, function(err, results) {
            return done(null, newUser, { isNew: true, emblem: results.createEmblem })
          })
        } else {
          return done(null, user, { isNew: false })
        }
      })
    },
    function(user, userExtras, done) {
      if (userExtras.isNew) {
        // If they signed up through a referall link, reward the appropriate referrer
        if (request.state.friend) {
          User.findOne({ referral_id: request.state.friend }, function(err, friend_user) {
            if (err) return done(Boom.wrap(err, 500))
            // if the friend doesnt exist, just create a new account
            if (!friend_user) return done(null, user, userExtras)

            friend_user.friends.push(user._id);
            user.friend = friend_user._id;
            user.addFreeMonth();

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
    }, function(user, userExtras, done) {
      user.logged_in = true
      if (userExtras.isNew) {
        var emailTemplate = require('lib/util/email/templates/welcome-email');
        emailTemplate.locals = {
          FNAME: user.first_name
        }
        Email.sendEmail(emailTemplate)

        user.emblem = userExtras.emblem;
        user.token = request.auth.credentials.token;
        user.save(function(err) {
          if (err) return reply(Boom.wrap(err, 500))
          request.auth.session.set(user);
          return reply.redirect('/register/finish').unstate('friend');
        })
      } else {
        request.auth.session.set(user);
        return reply.redirect('/facebook/login')
      }
    }
  ])
}

function finalize(request, reply) {
  if (request.method === 'get') {
    if (request.state.sid.scope !== constants.SCOPE.PRE_AUTHENTICATED) {
      return reply.redirect('/login')
    }
    reply.view('register_finish', {
      title: 'Register for Start Essential',
      email: request.state.sid.email
    });
  }
  if (request.method === 'post') {
    var preRegisterInfo = request.state.se_register ? request.state.se_register : null;

    User.findOne({ _id: request.state.sid._id }).exec(function(err, user) {
      if (err) return reply(Boom.wrap(err, 500))
      if (!user) return reply(Boom.unauthorized('You must have an user account to setup payment'))

      var stripeData = {
        source: request.payload.stripeToken,
        plan: constants.SUBSCRIPTIONS.TIER_1.NAME,
        email: request.state.sid.email
      }
      if (preRegisterInfo.coupon) {
        stripeData.coupon = preRegisterInfo.coupon
      }

      async.waterfall([
        function(done) {
          // If the user exists in stripe already, end their trial so they don't "play the system" and use the existing object
          if (user.stripe.id) {
            stripeData.trial_end = 'now';
            stripe.customers.retrieve( user.stripe.id, function(err, customer) {
              if (customer && customer.deleted) {
                stripe.customers.create(stripeData, function(err, customer) {
                  if (err) return done(Boom.badImplementation())
                  return done(null, customer, false)
                })
              } else {
                stripe.customers.update( user.stripe.id, stripeData, function(err, customer) {
                  if (err) return done(Boom.badImplementation('', err))
                  return done(null, customer, false)
                });
              }
            })
          } else {
            stripe.customers.create(stripeData, function(err, customer) {
              if (err) return done(Boom.badImplementation('', err))
              return done(null, customer, true)
            })
          }
        },
        function(customer, isNew, done) {
          if (isNew) {
            user.stripe.date = Date.now();
          }
          user.stripe.id = customer.id;
          user.stripe.subscription = customer.subscriptions.data[0].plan.id
          user.stripe.subscription_id = customer.subscriptions.data[0].id
          user.records.week_renew_date = moment().add(1, 'week').unix()
          user.records.month_renew_date = customer.subscriptions.data[0].current_period_end
          user.records.downloads = 2;
          user.records.downloaded = 0;
          user.scope = constants.SCOPE.AUTHENTICATED;
          user.deleted = false; // just incase they are reactivating their account
          user.createUserToken()
          user.save(function(err) {
            return done(null, user)
          })
        }
      ], function(err, user) {
        if (err) {
          request.log(['error', 'registration'], err)
          return reply.redirect('/register/finish' + _message('There was an error while creating your account. Please contact us for assistance.'))
        }
        request.auth.session.set(user)
        return reply.redirect('/thankyou').unstate('se_register')
      })

    })
  }
}
