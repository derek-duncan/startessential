var mongoose = require('mongoose')
var async = require('async')
var Joi = require('joi')
var Boom = require('boom')
var User = mongoose.model('User');
var IP = mongoose.model('IP');
var Post = mongoose.model('Post');
var Email = require('../util/email');

function loginFacebookUser(request, reply) {
  var profile = request.auth.credentials.profile;
  User.findOne({email: profile.email}, function(err, user) {
    if (err) return reply(Boom.wrap(err, 500))
    if (!user) {
      var newUser = new User({
        email: profile.email,
        first_name: profile.name.first,
        last_name: profile.name.last,
        facebook_connected: true,
        facebook_id: profile.id
      })
      newUser.save(function(err) {
        if (err) return reply(Boom.wrap(err, 500))
        return reply(newUser);
      })
    } else {
      if (!user.facebook_connected) {
        user.first_name = user.first_name || profile.name.first;
        user.last_name = user.last_name || profile.name.last;
        user.facebook_connected = true;
        user.facebook_id = profile.id;
      }
      return reply(user);
    }
  })
}

function newEmailUser(request, reply) {
  async.waterfall([
    function(done) {
      User.findOne({ email: request.payload.email }, function(err, user) {
        if (err) return done(Boom.badGateway())
        if (user) return done(Boom.conflict())

        return done(null);
      })
    }, function(done) {
      var ip = request.headers['x-forwarded-for'] ||
               request.raw.req.connection.remoteAddress ||
               request.raw.req.socket.remoteAddress ||
               request.raw.req.connection.socket.remoteAddress;
      async.waterfall([
        function(done) {
          IP.find({ip: ip}, function(err, ips) {
            if (err) return done(Boom.wrap(err, 500))
            if (ips.length >= 5) {
              return done(Boom.forbidden('You\'re not allowed to register more then 5 email address on this ip address'))
            } else {
              return done()
            }
          })
        },
        function(done) {
          var newIP = new IP({ip: ip})
          newIP.save(function(err) {
            if (err) return done(Boom.wrap(err, 500))
            done()
          })
        }
      ], function(err) {
        if (err) return done(err)
        return done()
      })
    }, function(done) {
      var user = new User({ email: request.payload.email });
      if (request.payload.friend) {
        User.findOne({ referral_id: request.payload.friend }, function(err, friend_user) {
          if (err) return done(Boom.wrap(err, 500))
          if (!friend_user) return done(null, user) // if the friend doesnt exist, just create a new account
          friend_user.friends.push(user._id);
          user.friend = friend_user._id;

          friend_user.save(function(err) {
            if (err) return done(Boom.wrap(err, 500))

            return done(null, user);
          })
        })
      } else {
        return done(null, user)
      }
    }, function(user, done) {
      user.save(function(err) {
        if (err) return done(Boom.wrap(err, 500))
        return done(null, user)
      })
    },
    function(user, done) {
      Email.send(user.email, function(err) {
        if (err) console.log(Boom.wrap(err, 500))
      })
      return done(null, user)
    }
  ], function(err, user) {
    console.log(err);
    if (err) return reply(err)
    return reply(null, user)
  })
}

module.exports = {
  User: {
    new: newEmailUser,
    loginFacebook: loginFacebookUser
  }
}
