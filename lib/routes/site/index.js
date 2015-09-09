var mongoose = require('mongoose')
var async = require('async')
var _ = require('lodash')
var Joi = require('joi')
var Boom = require('boom')
var moment = require('moment');

var constants = require('lib/constants');

var User = mongoose.model('User');
var Site = mongoose.model('Site');

var siteCtrl = require('lib/controllers/site');

// All routes are prefixed with /users

exports.register = function(server, options, next) {
  server.route({
    method: 'GET',
    path: '/{site_name}',
    config: {
      auth: {
        strategy: 'session',
        mode: 'try'
      }
    },
    handler: siteCtrl.siteHomepage
  });
  server.route({
    method: 'GET',
    path: '/{site_name}/articles/story',
    config: {
      auth: false,
      plugins: {
        'site_user_check': {
          bypass: false
        }
      }
    },
    handler: siteCtrl.viewArticleForSite
  });

  server.route({
    method: 'GET',
    path: '/{site_name}/tour',
    config: {
      auth: false,
      plugins: {
        'site_user_check': {
          bypass: false
        }
      }
    },
    handler: siteCtrl.viewTourForSite
  });

  server.route({
    method: 'GET',
    path: '/{site_name}/edit',
    config: {
      auth: false,
      plugins: {
        'site_user_check': {
          bypass: false
        }
      }
    },
    handler: function(request, reply) {
      reply.redirect('https://startessential.com/site');
    }
  });

  next()
}

exports.register.attributes = {
  name: 'siteRoutes',
  version: '0.1'
}
