var User, // User model
    Post, // Post model
    Boom,
    _,
    CONSTANTS,
    async,
    mongoose;

_ = require('lodash')
CONSTANTS = require('_/constants')
async = require('async')
mongoose = require('mongoose')
User = mongoose.model('User');
Post = mongoose.model('Post');
Boom = require('boom');

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
    }, function(results, done) {
      async.each(CONSTANTS.CATEGORIES, function(category, done) {
        Post.find({category: category}).limit(3).exec(function(err, posts) {
          var obj = {}
          obj[category] = posts;
          results.categories = results.categories || {};
          _.extend(results.categories, obj)
          return done()
        })
      }, function(err) {
        return done(null, results)
      })
    }
  ], function(err, results) {
    if (err) reply(err)
    reply.view('app/posts', {
      featured: results.featured,
      posts: results.posts,
      categories: results.categories,
      active: 'explore'
    }).state('api_token', request.state.sid.api_token.token)
  })
}
