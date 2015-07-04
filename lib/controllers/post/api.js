var _ = require('lodash')
var constants = require('_/constants')
var async = require('async')
var mongoose = require('mongoose')
var User = mongoose.model('User');
var Post = mongoose.model('Post');
var Boom = require('boom');
var responseHandler = require('_/util/responseHandler')

module.exports = {
  findAll: findAll
}

function findAll(request, reply) {
  var sid = request.state.sid
  var limit = request.query.limit ? request.query.limit : 0
  var offset = request.query.offset ? request.query.offset : 0

  Post.find({}).select('-image.original').sort({date_created: 'desc'}).limit(limit).skip(offset).lean().exec(function(err, posts) {
    if (err) reply(err)
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
      return reply(responseHandler(true, posts))
    })
  })
}
