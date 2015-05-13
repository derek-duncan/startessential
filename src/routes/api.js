var mongoose = require('mongoose')
var async = require('async')
var Joi = require('joi')
var Boom = require('boom')
var User = mongoose.model('User');
var IP = mongoose.model('IP');

exports.register = function(server, options, next) {
  server.route({
    method: 'GET',
    path: '/api/v1/users',
    handler: function (request, reply) {
      User.find({}, function(err, users) {
        reply(users)
      })
    }
  });
  server.route({
    method: 'POST',
    path: '/api/v1/users',
    handler: function (request, reply) {
      async.waterfall([
        function(done) {
          var ip = request.headers['x-forwarded-for'] ||
                   request.raw.req.connection.remoteAddress ||
                   request.raw.req.socket.remoteAddress ||
                   request.raw.req.connection.socket.remoteAddress;
          async.parallel([
            function(done) {
              var newIP = new IP({ip: ip})
              newIP.save(function(err) {
                if (err) return done(Boom.wrap(err, 500))
                done()
              })
            },
            function(done) {
              IP.find({ip: ip}, function(err, ips) {
                if (err) return done(Boom.wrap(err, 500))
                if (ips.length >= 5) {
                  return done(Boom.forbidden('You\'re not allowed to register more then 5 email address on this ip address'))
                } else {
                  return done()
                }
              })
            }
          ], function(err) {
            if (err) return done(err)
            return done()
          })
        }, function(done) {
          User.findOne({ email: request.payload.email }, function(err, user) {
            if (err) return done(Boom.badGateway())
            if (user) return done(Boom.conflict())

            var user = new User({ email: request.payload.email });
            return done(null, user);
          })
        }, function(user, done) {
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
          sendEmail(user.email, function(err) {
            if (err) console.log(Boom.wrap(err, 500))
            return done(null, user)
          })
        }
      ], function(err, user) {
        console.log(err);
        if (err) return reply(err)
        return reply(user)
      })
    },
    config: {
      validate: {
        payload: {
          email: Joi.string().email().required(),
          friend: Joi.string().token().max(20)
        }
      }
    }
  });
  server.route({
    method: 'GET',
    path: '/api/v1/users/{id}',
    handler: function (request, reply) {
      User.findOne({_id: request.params.id}, function(err, user) {
        if (err) return reply(Boom.wrap(err, 500))
        if (!user) return reply(Boom.notFound('User could not be found'))
        return reply(user)
      })
    }
  });
}

exports.register.attributes = {
  name: 'apiRoutes',
  version: '0.1'
}

function sendEmail(email, done) {
  var MailChimpAPI = require('mailchimp').MailChimpAPI;
  var MailChimpAPIKey = 'f07d6c72ff341a4c4a9fbc3c2c2845ae-us9';
  var api;
  try {
    api = new MailChimpAPI(MailChimpAPIKey, { version : '2.0' });
  } catch (error) {
    return done(new Error('Error while adding email to Mail Chimp.'));
  }
  api.call('lists', 'subscribe', { id: 'b61c1b85db', email: { email: email }, double_optin: false }, function(err) {
    if (err) {
      return done(err);
    }
    //Successfully registered user
    return done(null);
  });
}
