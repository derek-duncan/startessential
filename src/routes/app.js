var mongoose = require('mongoose')
var async = require('async')
var _ = require('lodash')
var Joi = require('joi')
var Boom = require('boom')
var User = mongoose.model('User');
var Post = mongoose.model('Post');
var moment = require('moment');
var uploader = require('../util/uploader');

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
    path: '/posts/{year}/{month}/{day}/{public?}',
    config: {
      validate: {
        params: {
          year: Joi.string().min(4).max(4),
          month: Joi.string().min(2).max(2),
          day: Joi.string().min(2).max(2),
          public: Joi.string().min(4).max(4),
        }
      }
    },
    handler: function(request, reply) {
      var params = request.params;
      var date = moment(params.year + '/' + params.month + '/' + params.day).startOf('day'),
          tomorrow = moment(date).add(1, 'days');
      Post.findOne({
        date_created: {
          $gte: date.toDate(),
          $lt: tomorrow.toDate()
        }
      }, function(err, post) {
        if (err) return reply(Boom.wrap(err, 500))
        if (!post) return reply(Boom.notFound())
        if (params.public === 'view') {
          reply.view('app/post_view', {
            post: post,
            title: post.title
          })
        } else {
          if (request.query.access === post.share_token) {
            reply.view('app/post', {
              post: post,
              title: post.title
            })
          } else {
            reply(Boom.forbidden())
          }
        }
      })
    }
  })

  // Admin
  server.route({
    method: 'GET',
    path: '/admin',
    handler: function(request, reply) {
      async.waterfall([
        function(done) {
          User.find({}, function(err, users) {
            if (err) return done(Boom.wrap(err, 500));
            return done(null, users)
          })
        }
      ], function(err, users) {
        if (err) reply(err);
        reply.view('admin/index', {
          users: users
        });
      })
    }
  })

  server.route({
    method: 'GET',
    path: '/admin/posts',
    handler: function(request, reply) {
      async.waterfall([
        function(done) {
          Post.find({}, function(err, posts) {
            if (err) return done(Boom.wrap(err, 500))
            return done(null, posts)
          })
        }
      ], function(err, posts) {
        if (err) reply(err)
        reply.view('admin/posts', {
          posts: posts
        })
      })
    }
  })

  server.route({
    method: 'GET',
    path: '/admin/posts/{id}',
    handler: function(request, reply) {
      async.waterfall([
        function(done) {
          Post.findOne({_id: request.params.id}, function(err, post) {
            if (err) return done(Boom.wrap(err, 500))
            if (!post) return done(Boom.create(404, 'Could not find post'))
            return done(null, post)
          })
        }
      ], function(err, post) {
        if (err) reply(err)
        var date_format = post.date_created.toISOString().slice(0,10).replace(/-/g,"/");
        reply.view('admin/post.jade', {
          post: post,
          date: date_format
        })
      })
    }
  })

  server.route({
    method: 'POST',
    config: {
      payload: {
        output: 'stream'
      },
    },
    path: '/admin/posts/{id}',
    handler: function(request, reply) {
      async.waterfall([
        function(done) {
          Post.findOne({_id: request.params.id}, function(err, post) {
            if (err) return done(Boom.wrap(err, 500))
            if (!post) return done(Boom.create(404, 'Could not find post'))
            post.title = request.payload.title;
            post.content = request.payload.content;
            post.day = request.payload.day;
            post.new_share_token = request.payload.new_share_token === 'on' ? true : false;
            return done(null, post)
          })
        }, function(post, done) {
          if (request.payload.image.hapi.filename.length) {
            uploader.image(request.payload.image, post.date_formatted, function(err, image_url) {
              if (err) return done(err)
              post.image_url = image_url
              return done(null, post)
            })
          } else {
            return done(null, post)
          }
        }, function(post, done) {
          post.save(function(err) {
            if (err) return done(Boom.wrap(err, 500))
            return done(null, post)
          })
        }
      ], function(err, post) {
        if (err) reply(err)
        reply.redirect('/admin/posts/' + post._id)
      })
    }
  })

  server.route({
    method: 'GET',
    path: '/admin/new',
    handler: function(request, reply) {
      reply.view('admin/new_post.jade')
    }
  })

  server.route({
    method: 'POST',
    path: '/admin/new',
    config: {
      payload: {
        output: 'stream'
      },
      validate: {
        payload: {
          title: Joi.string(),
          content: Joi.string(),
          day: Joi.string(),
          image: Joi.any()
        }
      }
    },
    handler: function(request, reply) {
      async.waterfall([
        function(done) {
          var post = new Post({
            title: request.payload.title,
            content: request.payload.content,
            day: request.payload.day
          })
          uploader.image(request.payload.image, post.date_created, function(err, image_url) {
            if (err) return done(err)
            post.image_url = image_url
            return done(null, post)
          })
        },
        function(post, done) {
          post.save(function(err) {
            if (err) return done(Boom.wrap(err, 500))
            return done(null, post)
          })
        }
      ], function(err, post) {
        if (err) reply(err)
        reply.redirect('/admin/posts/' + post._id)
      })
    }
  })

  next()
}

exports.register.attributes = {
  name: 'appRoutes',
  version: '0.1'
}
