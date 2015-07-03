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
    handler: AppCtrl.User.register.init
  });

  server.route({
    method: ['GET', 'POST'], // Must handle both GET and POST
    path: '/facebook/login',   // The callback endpoint registered with the provider
    config: {
      auth: 'facebook'
    },
    handler: AppCtrl.User.login
  });

  server.route({
    method: 'GET', // Must handle both GET and POST
    path: '/logout',   // The callback endpoint registered with the provider
    config: {
      handler: AppCtrl.User.logout,
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
    config: {
      auth: {
        strategy: 'session',
        scope: ['authenticated']
      }
    },
    handler: AppCtrl.Post.findAll
  })

  server.route({
    method: 'GET',
    path: '/posts/{url_path}',
    config: {
      auth: {
        strategy: 'session',
        scope: ['authenticated'],
      },
      validate: {
        params: {
          url_path: Joi.string()
        }
      }
    },
    handler: AppCtrl.Post.findOne
  })

  // Save posts

  server.route({
    method: ['POST'],
    path: '/posts/{id}/save',
    config: {
      auth: {
        strategy: 'session',
        scope: ['authenticated'],
      },
      validate: {
        params: {
          id: Joi.string(),
        }
      }
    },
    handler: AppCtrl.Post.Saved.save
  })

  server.route({
    method: ['POST'],
    path: '/save/{id}/remove',
    config: {
      auth: {
        strategy: 'session',
        scope: ['authenticated'],
      },
      validate: {
        params: {
          id: Joi.string(),
        }
      }
    },
    handler: AppCtrl.Post.Saved.remove
  })

  server.route({
    method: 'GET',
    path: '/saved',
    config: {
      auth: {
        strategy: 'session',
        scope: ['authenticated'],
      }
    },
    handler: AppCtrl.Post.Saved.index
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
    handler: AppCtrl.Post.Saved.preview
  })

  // Publish post

  server.route({
    method: ['GET', 'POST'],
    path: '/publish/{saved_code}',
    config: {
      auth: {
        strategy: 'session',
        scope: ['authenticated']
      },
      validate: {
        params: {
          saved_code: Joi.string()
        }
      }
    },
    handler: AppCtrl.Post.Saved.publish
  })

  // Register
  server.route({
    method: 'GET',
    path: '/register',
    config: {
      auth: false
    },
    handler: function (request, reply) {
      reply.view('register', {
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
    handler: AppCtrl.User.register.pre
  })

  server.route({
    method: ['GET', 'POST'],
    path: '/register/finish',
    config: {
      auth: 'session'
    },
    handler: AppCtrl.User.register.finalize
  })

  // User

  server.route({
    method: 'GET',
    path: '/account',
    handler: AppCtrl.User.index,
    config: {
      auth: {
        strategy: 'session',
        scope: ['authenticated']
      }
    }
  })
  server.route({
    method: 'POST',
    path: '/account/remove',
    handler: AppCtrl.User.remove,
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
      }
    },
    handler: AppCtrl.User.update
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

  server.route({
    method: 'GET',
    path: '/test/email',
    handler: function(request, reply) {
      require('_/email').getHTML(request.query.key, function(err, html) {
        return reply(html)
      })
    }
  })

  next()
}

exports.register.attributes = {
  name: 'appRoutes',
  version: '0.1'
}
