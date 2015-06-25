var User, // User model
    Post, // Post model
    _,
    CONSTANTS,
    async,
    mongoose;

_ = require('lodash')
CONSTANTS = require('_/constants')
async = require('async')
mongoose = require('mongoose')

User = mongoose.model('User');
Post = mongoose.model('Post');

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
      title: 'Your Start Essential Account',
      user: user,
      active: 'account'
    });
  })
}

function update(request, reply) {
  if (request.state.sid._id === request.payload._id) {
    async.waterfall([
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
              Email.update(user.email, request.payload.email, user.stripe.id, function(err) {
                if (err) console.log(err)
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
        return reply.redirect('/account')
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
    user.scope = 'pre_authenticated';
    Email.remove(user.email, function(err) {
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
        if (!user) return reply.redirect('/register' + _message('You are not registered'))

        // Run weekly subscription cron and generate api_token
        async.waterfall([
          function(done) {
            user.updateSubscriptionWeek(function() {
              return done()
            })
          },
          function(done) {
            User.createUserToken(user.email, user.scope, function(err, tokenObj) {
              return done(null, tokenObj)
            })
          }
        ], function(err, tokenObj) {
          request.auth.session.set(user);
          if (user.scope === 'pre_authenticated') {
            return reply.redirect('/register/finish' + _message('Please add payment information'))
          }
          return done(null, tokenObj)
        })
      })
    }
  ], function(err, tokenObj) {
    if (err) return reply(err)
    if (request.query.redirect) {
      return reply.redirect(redirect)
    } else {
      return reply.redirect('/posts')
    }
  })
}

function logout(request, reply) {
  request.auth.session.clear();
  return reply.redirect('/');
}

