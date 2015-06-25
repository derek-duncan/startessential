var User, Email, emails, stripe, _, CONSTANTS, async, mongoose;

_ = require('lodash')
CONSTANTS = require('_/constants')
async = require('async')
mongoose = require('mongoose')

User = mongoose.model('User');
Email = require('_/util/email');
emails = require('_/email');
stripe = require('stripe')('sk_test_8T9RioM6rUcrweVcJ0VluRyG');

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
          Email.save({ email: newUser.email, name: newUser.full_name }, function(err) {
            if (err) console.log(Boom.wrap(err, 500));
          })
          Email.send(newUser.email, emails.NEW_USER(), function(err) {
            if (err) console.log(Boom.wrap(err, 500));
          })
          return done(null, newUser, true)
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
    if (request.state.sid.scope !== 'pre_authenticated') {
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
                  if (err) reply(Boom.badImplementation())
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
              if (err) reply(Boom.badImplementation())
              return done(null, customer, true)
            })
          }
        }
      ], function(err, customer, isNew) {
        if (err) return reply(err)

        if (isNew) {
          user.stripe.date = Date.now();
        }
        user.stripe.id = customer.id;
        user.stripe.subscription = customer.subscriptions.data[0].plan.id
        user.stripe.subscription_id = customer.subscriptions.data[0].id
        user.records.week_renew_date = moment().add(1, 'week').unix()
        user.records.month_renew_date = customer.subscriptions.data[0].current_period_end
        user.scope = 'authenticated';
        user.deleted = false; // just incase they are reactivating their account
        user.save()
        return reply.redirect('/thankyou')
      })

    })
  }
}
