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
  findAll: findAll
}

function findAll(request, reply) {
  var body, limit, offset, sid;
  sid = request.state.sid
  body = request.query ? request.query : {};
  limit = body.limit ? body.limit : 0
  offset = body.offset ? body.offset : 0

  Post.find({}).sort({date_created: 'desc'}).limit(limit).skip(offset).lean().exec(function(err, posts) {
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
      return reply({
        posts: posts
      })
    })
  })
}
