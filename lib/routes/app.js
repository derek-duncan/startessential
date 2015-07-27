var mongoose = require('mongoose')
var async = require('async')
var _ = require('lodash')
var Joi = require('joi')
var Boom = require('boom')
var User = mongoose.model('User');
var Post = mongoose.model('Post');
var Saved = mongoose.model('Saved');
var moment = require('moment');
var Tag = mongoose.model('Tag');
var constants = require('lib/constants');

var ApiCtrl = require('lib/controllers/api');
var AppCtrl = require('lib/controllers/app');

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
    method: 'GET',
    path: '/sitemap.xml',
    handler: function (request, reply) {
      Saved.find({}).lean().exec(function(err, saves) {
        var urls = {
          'urlset': {
            '@xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9',
            '#list': []
          }
        }
        async.each(saves, function(save, done) {
          urls['urlset']['#list'].push({
            url: {
              loc: "https://startessential.com/preview/" + save.short_code,
              lastmod: moment(save.date_created).format('YYYY-MM-DD'),
              changefreq: "yearly",
              priority: '0.9'
            }
          })
          return done()
        }, function() {
          var customURLs = {
            url: {
              loc: 'https://startessential.com/',
              changefreq: 'monthly',
              priority: '0.8'
            },
            url: {
              loc: 'https://startessential.com/register',
              changefreq: "monthly",
              priority: '0.6'
            }
          }
          urls['urlset']['#list'].push(customURLs)

          var builder = require('xmlbuilder');

          var xml = builder.create(urls)
          xml.dec('1.0', 'UTF-8')

          var str = xml.end({ pretty: true});
          return reply(str)
            .type('text/xml');
        })
      })
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
    handler: AppCtrl.Post.findAll
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
    handler: AppCtrl.Post.findOne
  })

  // Save posts

  server.route({
    method: ['POST'],
    path: '/posts/{id}/save',
    config: {
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
      auth: {
        strategy: 'session'
      }
    },
    handler: AppCtrl.User.register.finalize
  })

  // User

  server.route({
    method: 'GET',
    path: '/account',
    handler: AppCtrl.User.index,
  })
  server.route({
    method: 'POST',
    path: '/account/remove',
    handler: AppCtrl.User.remove,
  })
  server.route({
    method: 'POST',
    path: '/account/settings',
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
