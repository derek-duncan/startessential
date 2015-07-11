var _ = require('lodash')
var constants = require('_/constants')
var async = require('async')
var mongoose = require('mongoose')
var User = mongoose.model('User');
var Post = mongoose.model('Post');
var Boom = require('boom');
var responseHandler = require('_/util/responseHandler')

module.exports = {
  findOne: findOne,
  findAll: findAll,
  search: search,
  Saved: require('./save'),
  API: require('./api')
}

function findOne(request, reply) {
  var url_path = request.params.post_id;

  Post.findOne({ url_path: url_path }).populate('tags').exec(function(err, post) {
    if (err) return reply(responseHandler('fail', err));
    if (!post) return reply(responseHandler('error', null, 'Post could not be found'));

    return reply(responseHandler('success', post, 'Successfully found post'));
  })
}

function findAll(request, reply) {
  var sid = request.state.sid
  var limit = request.query.limit ? request.query.limit : 0
  var offset = request.query.offset ? request.query.offset : 0
  var query = request.query.featured ? { featured: true } : {};

  Post.find(query).select('-image.original').sort({date_created: 'desc'}).limit(limit).skip(offset).lean().exec(function(err, posts) {
    if (err) return reply(responseHandler('fail', err))
    async.each(posts, function(post, done) {
      var isSaved = _.some(sid.saved_posts, function(saved_id) {
        return post._id.equals(saved_id)
      })
      if (isSaved) {
        post.isSaved = true;
      } else {
        post.isSaved = false;
      }
      return done()
    }, function() {
      return reply(responseHandler('success', posts))
    })
  })
}

function search(request, reply) {
  var query = request.query.q;
  var limit = request.query.limit;
  var offset = request.query.offset;
  Post.find({ $text: { $search: query }}).select('title content image').sort({date_created: 'desc'}).limit(limit).skip(offset).exec(function(err, posts) {
    if (err) return reply(responseHandler('fail', err));
    return reply(responseHandler('success', posts));
  })
}
