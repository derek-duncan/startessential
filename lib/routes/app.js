var mongoose = require('mongoose')
var async = require('async')
var _ = require('lodash')
var Joi = require('joi')
var Boom = require('boom')
var User = mongoose.model('User');
var Post = mongoose.model('Post');
var moment = require('moment');
var uploader = require('../util/uploader');
var Tag = mongoose.model('Tag');

var AppCtrl = require('../controllers/app');

exports.register = function(server, options, next) {
  server.route({
    method: 'GET',
    path: '/n/{number}',
    config: {
      auth: false,
      validate: {
        params: {
          number: Joi.string().min(7).max(7)
        }
      }
    },
    handler: function(request, reply) {
      var number = request.params.number;
      reply.redirect('https://www.youngliving.com/signup/?site=US&sponsorid='+number+'&enrollerid='+number)
    }
  })

  // Admin
  server.route({
    method: 'GET',
    path: '/admin',
    config: {
      auth: {
        strategy: 'session',
        scope: ['admin']
      }
    },
    handler: AppCtrl.Admin.index
  })

  server.route({
    method: 'GET',
    path: '/admin/posts',
    config: {
      auth: {
        strategy: 'session',
        scope: ['admin']
      }
    },
    handler: AppCtrl.Admin.findAll
  })

  server.route({
    method: 'GET',
    path: '/admin/posts/{id}',
    config: {
      auth: {
        strategy: 'session',
        scope: ['admin']
      }
    },
    handler: AppCtrl.Admin.findOne
  })

  server.route({
    method: 'POST',
    path: '/admin/posts/{id}',
    config: {
      payload: {
        output: 'stream',
        parse: true,
        maxBytes: 209715200
      },
      auth: {
        strategy: 'session',
        scope: ['admin']
      }
    },
    handler: AppCtrl.Admin.update
  })

  server.route({
    method: 'GET',
    path: '/admin/new',
    config: {
      auth: {
        strategy: 'session',
        scope: ['admin']
      }
    },
    handler: function(request, reply) {
      Tag.find().exec(function(err, tags) {
        var tagsString = _.map(tags, function(tag) {
          return tag.name
        }).join(',');
        reply.view('admin/new_post.jade', {
          tags: tagsString
        })
      })
    }
  })

  server.route({
    method: 'POST',
    path: '/admin/new',
    config: {
      payload: {
        output: 'stream',
        parse: true,
        maxBytes: 209715200
      },
      auth: {
        strategy: 'session',
        scope: ['admin']
      }
    },
    handler: AppCtrl.Admin.create
  })

  next()
}

exports.register.attributes = {
  name: 'appRoutes',
  version: '0.1'
}
