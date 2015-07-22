var mongoose = require('mongoose')
var async = require('async')
var _ = require('lodash')
var Joi = require('joi')
var Boom = require('boom')
var User = mongoose.model('User');
var IP = mongoose.model('IP');
var Post = mongoose.model('Post');
var ApiCtrl = require('lib/controllers/api');
var AppCtrl = require('lib/controllers/app');

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
    path: '/api/v1/suggestions',
    config: {
      auth: {
        strategy: 'simple',
        scope: ['authenticated']
      },
      validate: {
        payload: {
          description: Joi.string().min(10)
        }
      }
    },
    handler: AppCtrl.User.API.sendSuggestion
  })

}

exports.register.attributes = {
  name: 'apiRoutes',
  version: '0.1'
}
