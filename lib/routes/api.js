var mongoose = require('mongoose')
var async = require('async')
var constants = require('_/constants');
var _ = require('lodash')
var Joi = require('joi')
var Boom = require('boom')
var User = mongoose.model('User');
var Post = mongoose.model('Post');
var AppCtrl = require('../controllers/app');

exports.register = function(server, options, next) {
  var defaultAuth = {
    strategy: 'bearer',
    scope: constants.SCOPE.PRE_AUTHENTICATED
  }

  server.route({
    method: 'GET',
    path: '/api/v1/posts',
    config: {
      auth: {
        strategy: 'bearer',
        scope: ['authenticated']
      }
    },
    handler: AppCtrl.Post.API.findAll
  });

  server.route({
    method: 'POST',
    path: '/api/v1/login',
    config: {
      auth: false
    },
    handler: AppCtrl.User.API.login
  });

  server.route({
    method: 'GET',
    path: '/api/v1/users/{user_id}',
    config: {
      auth: defaultAuth
    },
    handler: AppCtrl.User.API.getUser
  });

  server.route({
    method: 'POST',
    path: '/api/v1/saves',
    config: {
      auth: {
        strategy: 'bearer',
        scope: ['authenticated']
      }
    },
    handler: function(request, reply) {
      return reply({status: true, data: null})
    }
  });
}

exports.register.attributes = {
  name: 'apiRoutes',
  version: '0.1'
}
