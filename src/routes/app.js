var mongoose = require('mongoose')
var async = require('async')
var _ = require('lodash')
var Joi = require('joi')
var Boom = require('boom')
var User = mongoose.model('User');
var Post = mongoose.model('Post');
var moment = require('moment');
var uploader = require('../util/uploader');

var ApiCtrl = require('../controllers/api');
var AppCtrl = require('../controllers/app');

exports.register = function(server, options, next) {
  server.route({
    method: 'GET',
    path: '/app',
    handler: function (request, reply) {
      reply.view('app/app');
    }
  })
  server.route({
    method: 'GET',
    path: '/app/{param*}',
    handler: function (request, reply) {
      reply.view('app/app');
    }
  })

  server.route({
    method: ['GET', 'POST'], // Must handle both GET and POST
    path: '/facebook/register',   // The callback endpoint registered with the provider
    config: {
      auth: 'facebook'
    },
    handler: AppCtrl.User.facebookRegister
  });

  server.route({
    method: ['GET', 'POST'], // Must handle both GET and POST
    path: '/facebook/login',   // The callback endpoint registered with the provider
    config: {
      auth: 'facebook'
    },
    handler: AppCtrl.User.facebookLogin
  });

  server.route({
    method: 'GET', // Must handle both GET and POST
    path: '/logout',   // The callback endpoint registered with the provider
    config: {
      handler: AppCtrl.User.logout,
      auth: 'session'
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
    config: {
      auth: {
        strategy: 'session',
        scope: ['authenticated']
      }
    },
    handler: AppCtrl.Post.allPosts
  })

  server.route({
    method: 'GET',
    path: '/posts/{year}/{month}/{day}',
    config: {
      auth: {
        strategy: 'session',
        scope: ['authenticated'],
      },
      validate: {
        params: {
          year: Joi.string().min(4).max(4),
          month: Joi.string().min(2).max(2),
          day: Joi.string().min(2).max(2)
        }
      }
    },
    handler: AppCtrl.Post.find
  })

  server.route({
    method: ['GET', 'POST'],
    path: '/publish/{post_id}',
    config: {
      auth: {
        strategy: 'session',
        scope: ['authenticated']
      },
      validate: {
        params: {
          post_id: Joi.string()
        }
      }
    },
    handler: AppCtrl.Post.publishToFacebook
  })

  // Register
  server.route({
    method: ['GET', 'POST'],
    path: '/register/finish',
    config: {
      auth: 'session'
    },
    handler: AppCtrl.User.stripeRegister
  })

  // User

  server.route({
    method: 'GET',
    path: '/account',
    handler: AppCtrl.User.accountView
  })
  server.route({
    method: 'POST',
    path: '/account/remove',
    handler: AppCtrl.User.accountRemove,
    config: {
      auth: {
        strategy: 'session',
        scope: ['authenticated']
      }
    }
  })
  server.route({
    method: 'POST',
    path: '/account/settings',
    config: {
      auth: {
        strategy: 'session',
        scope: ['authenticated']
      },
      validate: {
        payload: {
          _id: Joi.any(),
          memberNumber: Joi.string().min(7).max(7),
          email: Joi.string().email()
        }
      }
    },
    handler: AppCtrl.User.accountSettings
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
    handler: AppCtrl.Admin.findAllPosts
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
    handler: AppCtrl.Admin.findPost
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
    handler: AppCtrl.Admin.updatePost
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
      reply.view('admin/new_post.jade')
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
      },
      validate: {
        payload: {
          title: Joi.string(),
          content: Joi.string(),
          category: Joi.string(),
          day: Joi.string(),
          image: Joi.any(),
          featured: Joi.any()
        }
      }
    },
    handler: AppCtrl.Admin.createPost
  })

  next()
}

exports.register.attributes = {
  name: 'appRoutes',
  version: '0.1'
}
