var mongoose = require('mongoose')
var async = require('async')
var _ = require('lodash')
var _message = require('lib/util/createMessage');
var Joi = require('joi')
var Boom = require('boom')
var User = mongoose.model('User');
var Post = mongoose.model('Post');
var Saved = mongoose.model('Saved');
var moment = require('moment');
var Tag = mongoose.model('Tag');
var constants = require('lib/constants');

var AppCtrl = require('lib/controllers');

exports.register = function(server, options, next) {

  server.route({
    method: ['GET', 'POST'], // Must handle both GET and POST
    path: '/facebook/register',   // The callback endpoint registered with the provider
    config: {
      auth: 'facebook'
    },
    handler: AppCtrl.User.register.createUserAccount
  });

  server.route({
    method: ['GET', 'POST'], // Must handle both GET and POST
    path: '/facebook/login',   // The callback endpoint registered with the provider
    config: {
      auth: 'facebook'
    },
    handler: AppCtrl.User.loginUser
  });

  server.route({
    method: 'GET', // Must handle both GET and POST
    path: '/logout',   // The callback endpoint registered with the provider
    config: {
      handler: AppCtrl.User.logoutUser,
      auth: false
    }
  });

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

  server.route({
    method: 'GET',
    path: '/posts',
    handler: AppCtrl.Post.viewAllPosts
  })

  server.route({
    method: 'GET',
    path: '/posts/{url_path}',
    config: {
      validate: {
        params: {
          url_path: Joi.string()
        }
      }
    },
    handler: AppCtrl.Post.viewOnePost
  })

  // Save posts

  server.route({
    method: ['POST'],
    path: '/posts/{id}/save',
    config: {
      validate: {
        params: {
          id: Joi.string(),
        },
        query: {
          resave: Joi.number()
        }
      }
    },
    handler: AppCtrl.Post.Saved.savePost
  })

  server.route({
    method: ['POST'],
    path: '/save/{id}/remove',
    config: {
      validate: {
        params: {
          id: Joi.string(),
        }
      }
    },
    handler: AppCtrl.Post.Saved.removeSavedPost
  })

  server.route({
    method: 'GET',
    path: '/saved',
    handler: AppCtrl.Post.Saved.viewAllSavedPosts
  })

  // Public Preview

  server.route({
    method: ['GET'],
    path: '/preview/{saved_code}',
    config: {
      auth: {
        strategy: 'session',
        mode: 'try'
      }
    },
    handler: AppCtrl.Post.Saved.previewSavedPost
  })

  // Register
  server.route({
    method: 'GET',
    path: '/register',
    config: {
      auth: false
    },
    handler: function (request, reply) {
      reply.view('core/register', {
        title: 'Register for Start Essential',
        memberNumber: request.query.se_member_number
      });
    }
  })
  server.route({
    method: 'POST',
    path: '/register/pre',
    config: {
      auth: false
    },
    handler: AppCtrl.User.register.preCreateUserAccountSetup
  })

  server.route({
    method: ['GET', 'POST'],
    path: '/register/finish',
    config: {
      auth: {
        strategy: 'session',
      },
      plugins: {
        'trial_validate': {
          bypass: true
        },
        'hapi-auth-cookie': {
          redirectTo: false
        }
      }
    },
    handler: AppCtrl.User.register.completeUserAccount
  })

  // User

  server.route({
    method: 'GET',
    path: '/account',
    handler: AppCtrl.User.viewUserAccount,
  })
  server.route({
    method: 'POST',
    path: '/account/remove',
    handler: AppCtrl.User.removeUser,
  })
  server.route({
    method: 'POST',
    path: '/account/settings',
    handler: AppCtrl.User.updateUser
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
        return reply.view('admin/new_post.jade', {
          tags: tagsString,
          categories: constants.CATEGORIES
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

  server.route({
    method: 'POST',
    path: '/webhooks/stripe/customer_discount_created',
    handler: AppCtrl.Webhook.discountCreated
  })

  next()
}

exports.register.attributes = {
  name: 'appRoutes',
  version: '0.1'
}
