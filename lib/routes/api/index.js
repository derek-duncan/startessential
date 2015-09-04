var mongoose = require('mongoose')
var async = require('async')
var _ = require('lodash')
var Joi = require('joi')
var Boom = require('boom')
var User = mongoose.model('User');
var Post = mongoose.model('Post');
var AppCtrl = require('lib/controllers');

exports.register = function(server, options, next) {
  server.route({
    method: 'GET',
    path: '/api/v1/posts',
    handler: AppCtrl.Post.API.findAll
  });
  server.route({
    method: 'POST',
    path: '/api/v1/suggestions',
    config: {
      validate: {
        payload: {
          description: Joi.string().min(10)
        }
      }
    },
    handler: AppCtrl.User.API.sendSuggestion
  })

  return next();
}

exports.register.attributes = {
  name: 'apiRoutes',
  version: '0.1'
}
