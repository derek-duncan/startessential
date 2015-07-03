var _ = require('lodash')
var constants = require('_/constants')
var async = require('async')
var mongoose = require('mongoose')
var Email = require('_/util/email')
var Joi = require('joi')
var _message = require('_/util/createMessage.js')

var User = mongoose.model('User');
var Post = mongoose.model('Post');
var Saved = mongoose.model('Saved');

module.exports = {
  index: index,
  update: update,
  remove: remove,
  register: require('./register'),
  login: login,
  logout: logout
}

function index(request, reply) {
  User.findOne({_id: request.state.sid._id}, function(err, user) {
    if (err || !user) return reply(Boom.forbidden());
    return reply.view('app/account', {
      title: 'Account Preferences | Start Essential',
      user: user,
      active: 'account'
    });
  })
}

function update(request, reply) {
  var schema = {
    memberNumber: Joi.number(),
    email: Joi.string().email()
  }
  if (request.state.sid._id === request.payload._id) {
    async.waterfall([
      function(done) {
        Joi.validate(request.payload, schema, { allowUnknown: true }, function(err, value) {
          if (err) {
            return reply.redirect('/account' + _message('Invalid updates'))
          }
          return done()
        })
      },
      function(done) {
        // This may possibly save before all the db requests finish
        User.findOne({ _id: request.payload._id }, function(err, user) {
          if (err) return done(Boom.badImplementation('', err))
          if (!user) return done(Boom.forbidden())
          if (user.member_number !== request.payload.memberNumber) {
            user.member_number = request.payload.memberNumber;
            Saved.update({_user: request.state.sid._id}, {$set: {isOld: true}}, function(err, numAffected) {
            })
          }

          if (user.email !== request.payload.email) {
            User.findOne({email: request.payload.email}, function(err, userExists) {
              if (userExists) {
                return done(Boom.conflict('That email address is already registered'))
              }
              Email.update(user.email, request.payload.email, user.stripe.id, constants.EMAIL_LIST.USERS, function(err) {
                if (err) system.log(['error'], err)
                user.email = request.payload.email;
                return done(null, user)
              });
            })
          } else {
            return done(null, user)
          }
        })
      }
    ], function(err, user) {
      if (err) return reply(err);
      user.save(function() {
        return reply.redirect('/account' + _message('Successfully updated account'))
      })
    })
  } else {
    return reply(Boom.forbidden())
  }
}

function remove(request, reply) {
  User.findOne({_id: request.payload._id}, function(err, user) {
    if (err || !user) return reply(Boom.forbidden());
    user.deleted = true;
    user.scope = constants.SCOPE.PRE_AUTHENTICATED;
    Email.remove(user.email, constants.EMAIL_LIST.USERS, function(err) {
    })
    stripe.customers.del(user.stripe.id);
    user.save(function() {
      return reply.redirect('/logout');
    })
  })
}

function login(request, reply) {
  var profile = request.auth.credentials.profile;

  async.waterfall([
    function(done) {
      User.findOne({ facebook_id: profile.id }).exec(function(err, user) {
        if (err) return reply(Boom.badImplementation())
        if (!user) return reply.redirect('/' + _message('You are not registered'))

        // Run weekly subscription cron and generate api_token
        async.waterfall([
          function(done) {
            if (user.scope === constants.SCOPE.PRE_AUTHENTICATED) {
              return reply.redirect('/register/finish' + _message('Please add payment information'))
            }
            return done()
          },
          function(done) {
            user.logged_in = true
            return done()
          },
          function(done) {
            user.updateSubscriptionWeek(function() {
              return done()
            })
          },
          function(done) {
            user.createUserToken()
            return done()
          },
          function(done) {
            user.save(function() {
              return done()
            })
          }
        ], function(err) {
          request.auth.session.set(user);
          return done(null)
        })
      })
    }
  ], function(err) {
    if (err) return reply(err)
    if (request.query.redirect) {
      return reply.redirect(redirect)
    } else {
      return reply.redirect('/posts')
    }
  })
}

function logout(request, reply) {
  var uid = request.state.sid ? request.state.sid._id : null;
  if (uid) {
    User.findOne({_id: uid}).select('logged_in').exec(function(err, user) {
      if (user) {
        user.logged_in = false
        user.save()
      }
    })
  }
  request.auth.session.clear();
  return reply.redirect('/');
}

