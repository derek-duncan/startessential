var mongoose = require('mongoose')
var async = require('async')
var _ = require('lodash')
var Joi = require('joi')
var Boom = require('boom')
var User = mongoose.model('User');
var Post = mongoose.model('Post');
var AppCtrl = require('../controllers/app');

exports.register = function(server, options, next) {
  server.route({
    method: 'GET',
    path: '/api/v1/posts',
    config: {
      auth: {
        strategy: 'simple',
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
}

exports.register.attributes = {
  name: 'apiRoutes',
  version: '0.1'
}
