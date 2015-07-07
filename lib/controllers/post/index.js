var _ = require('lodash')
var constants = require('lib/constants')
var async = require('async')
var mongoose = require('mongoose')
var User = mongoose.model('User');
var Post = mongoose.model('Post');
var Boom = require('boom');

module.exports = {
  findOne: findOne,
  findAll: findAll,
  Saved: require('./save'),
  API: require('./api')
}

function findOne(request, reply) {
  var url_path = request.params.url_path;

  Post.findOne({ url_path: url_path }).populate('tags').exec(function(err, post) {
    if (err) return reply(Boom.wrap(err, 500))
    if (!post) return reply(Boom.notFound())
    if (request.state.sid) {
      User.findOne({_id: request.state.sid._id }, function(err, user) {
        if (err) return reply(Boom.wrap(err, 500))
        user = user || {}
        reply.view('app/post', {
          post: post,
          title: post.title,
          user: user,
          user_exists: true
        })
      })
    } else {
      reply.view('app/post', {
        post: post,
        title: post.title,
        user: {},
        user_exists: false
      })
    }
  })
}

function findAll(request, reply) {
  async.waterfall([
    function(done) {
      async.parallel({
        posts: function(done) {
          Post.find({}).sort({date_created: 'desc'}).populate('tags').exec(function(err, posts) {
            if (err) return done(Boom.wrap(err, 500))
            return done(null, posts)
          })
        },
        featured: function(done) {
          Post.findOne({ featured: true }).sort({date_created: 'desc'}).populate('tags').exec(function(err, featured) {
            if (err) return done(Boom.badImplementation('', err))
            return done(null, featured)
          })
        }
      }, done)
    }
  ], function(err, results) {
    if (err) reply(err)
    reply.view('app/posts', {
      featured: results.featured,
      posts: results.posts,
      active: 'explore',
      title: 'Explore Graphics | Start Essential'
    }).state('api_token', request.state.sid.api_token.token)
  })
}
