var User, Email, emails, stripe, _, constants, async, mongoose, moment, Boom;

_ = require('lodash')
constants = require('_/constants')
async = require('async')
mongoose = require('mongoose')
moment = require('moment')
Boom = require('boom')

User = mongoose.model('User');
Email = require('_/util/email');
stripe = require('stripe')(constants.STRIPE_KEY);

module.exports = {
  init: init,
  finalize: finalize
}

function init(request, reply) {
  var profile = request.auth.credentials.profile;
  var memberNumber = request.state.se_member_number || null;

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
            member_number: memberNumber
          })
          async.parallel([
            function(done) {
              Email.save({ email: newUser.email, name: { first: newUser.first_name, last_name: newUser.last_name } }, constants.EMAIL_LIST.USERS, function(err) {
                if (err) console.log(['error', 'email', 'save'], err);
                return done()
              })
            }
          ], function() {
            return done(null, newUser, true)
          })
        } else {
          return done(null, user, false)
        }
      })
    }, function(user, isNew, done) {
      if (isNew) {
        if (request.state.friend) {
          User.findOne({ referral_id: request.state.friend }, function(err, friend_user) {
            if (err) return done(Boom.wrap(err, 500))
            if (!friend_user) return done(null, user, isNew) // if the friend doesnt exist, just create a new account

            friend_user.friends.push(user._id);
            user.friend = friend_user._id;
            user.addFreeMonth();

            friend_user.save(function(err) {
              if (err) return done(Boom.wrap(err, 500))
              return done(null, user, isNew);
            })
          })
        } else {
          return done(null, user, isNew)
        }
      } else {
        return done(null, user, isNew)
      }
    }, function(user, isNew, done) {
      user.logged_in = true
      if (isNew) {
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

    User.findOne({ _id: request.state.sid._id }).select('stripe scope deleted').exec(function(err, user) {
      if (err) return reply(Boom.wrap(err, 500))
      if (!user) return reply(Boom.unauthorized('You must have an user account to setup payment'))

      var stripeData = {
        source: request.payload.stripeToken,
        plan: 'basic',
        email: request.state.sid.email
      }

      async.waterfall([
        function(done) {
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
        if (err) return reply(err)
        request.auth.session.set(user)
        return reply.redirect('/thankyou')
      })

    })
  }
}
