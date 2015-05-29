var mongoose = require('mongoose')
var async = require('async')
var Joi = require('joi')
var Boom = require('boom')
var User = mongoose.model('User');
var IP = mongoose.model('IP');
var Post = mongoose.model('Post');
var ApiCtrl = require('../controllers/api');

exports.register = function(server, options, next) {
  server.route({
    method: 'GET',
    path: '/api/v1/users',
    config: {
      auth: {
        strategy: 'simple',
        scope: ['admin']
      }
    },
    handler: function (request, reply) {
      User.find({}, function(err, users) {
        reply(users)
      })
    }
  });
  server.route({
    method: 'POST',
    path: '/api/v1/users',
    config: {
      validate: {
        payload: {
          email: Joi.string().email().required(),
          friend: Joi.string().token().max(20)
        }
      }
    },
    handler: ApiCtrl.User.new
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
  // Facebook login
  server.route({
    method: ['GET', 'POST'], // Must handle both GET and POST
    path: '/api/v1/facebook/login',   // The callback endpoint registered with the provider
    config: {
      auth: 'facebook'
    },
    handler: ApiCtrl.User.loginFacebook
  });
}

exports.register.attributes = {
  name: 'apiRoutes',
  version: '0.1'
}
