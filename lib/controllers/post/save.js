var _ = require('lodash')
var constants = require('_/constants')
var async = require('async')
var mongoose = require('mongoose')
var Saved = mongoose.model('Saved');
var Post = mongoose.model('Post');
var User = mongoose.model('User');
var Boom = require('boom')
var moment = require('moment');
var uploader = require('_/util/uploader');
var _message = require('_/util/createMessage')
var responseHandler = require('_/util/responseHandler')

module.exports = {
  findAll: findAll,
  findOne: findOne,
  create: create,
  remove: remove,
  generate: generate
}

function findAll(request, reply) {
  var uid = request.query.uid;
  Saved.find({_user: uid}).sort({date_created: 'desc'}).populate('_post').exec(function(err, saved) {
    if (err) return reply(responseHandler('error', err))
    return reply(responseHandler('success', saved, 'Successfully found saved graphics'));
  })
}

function findOne(request, reply) {
  var saved_code = request.params.saved_code;
  Saved.findOne({short_code: saved_code}).populate('_post _user').exec(function(err, graphic) {
    if (err) return reply(responseHandler('fail', err))
    if (!graphic) return reply(responseHandler('error', {}, 'Saved graphic not found'))
    return reply(responseHandler('success', graphic, 'Successfully found saved graphic'));
  })
}

function create(request, reply) {
  var graphic_id = request.payload.graphic_id;
  var uid = request.payload.uid;
  User.findOne({_id: uid}).select('records').exec(function(err, user) {
    if (err) return reply(responseHandler('fail', err))
    if (!user) return reply(responseHandler('error', null, 'User not found'));
    if (user.hasDownload()) {
      generate(graphic_id, uid, false, function(err, saved) {
        if (err) return reply(responseHandler('err', err, 'User could not be found'));
        return reply(responseHandler('success', saved, 'Successfully saved post'));
      })
    } else {
      return reply(responseHandler('error', {}, 'No more downloads available'));
    }
  })
}

function remove(request, reply) {
  var save_id = request.params.id;
  async.waterfall([
    function(done) {
      Saved.findOne({_id: save_id, _user: request.state.sid._id}, function(err, saved) {
        if (err) return done(Boom.badImplementation('', err))
        if (!saved) return done(Boom.badImplementation('Saved post could not be found'))
        return done(null, saved)
      })
    },
    function(saved, done) {
      User.findOne({_id: request.state.sid._id}, function(err, user) {
        if (err) return done(Boom.badImplementation('', err))
        var index = _.indexBy(user.saved_posts, function(entry) {
          return entry.equals(saved._post)
        })
        user.saved_posts.splice(index, 1);
        user.save(function(err) {
          return done(null, saved)
        })
      })
    },
    function(saved, done) {
      saved.remove(function() {
        return done();
      })
    }
  ], function(err) {
    if (err) return reply(Boom.badImplementation('', err))
    return reply.redirect('/saved')
  })
}

/**
  * Customizes a post graphic with the user's info
  * @param {string} The id of the post to be customized
  * @param {string} The id of the user that is saving this post
  * @param {Boolean} A flag that indicates the graphic is being posted to facebook along with being saved
  * @param {Function} callback The function that returns the customized post
  */
function generate(post_id, uid, isPosted, callback) {
  async.waterfall([
    function(done) {
      async.parallel([
        function(done) {
          Saved.findOne({_post: post_id, _user: uid, isOld: false}, function(err, saved) {
            if (err) return done(Boom.badImplementation('', err))
            if (saved) {
              if (isPosted) {
                saved.posted = true;
                saved.save(function() {
                  return callback(null, saved)
                })
              } else {
                return callback(null, saved)
              }
            } else {
              return done()
            }
          })
        },
        function(done) {
          Post.findOne({_id: post_id}, function(err, post) {
            if (err) return done(Boom.badImplementation('', err))
            if (!post) return done(Boom.notFound('This post cannot be found'));
            return done(null, post)
          })
        }
      ], function(err, res) {
        if (err) return done(err)
        return done(null, res[1]) // result from second (index of 1) parallel function
      })
    },
    function(post, done) {
      post.customize(uid, function(err, images) {
        if (err) return done(Boom.badImplementation('', err))
        return done(null, images)
      })
    },
    function(images, done) {
      var saved = new Saved();
      saved._user = uid;
      saved._post = post_id;
      saved.custom_image = {
        original: {
          Url: images.original.Location,
          Key: images.original.Key
        },
        normal: {
          Url: images.normal.Location,
          Key: images.normal.Key
        },
        small: {
          Url: images.small.Location,
          Key: images.small.Key
        }
      }
      saved.isOld = false;
      if (isPosted) saved.posted = true;
      async.waterfall([
        function(done) {
          User.findOne({_id: uid}, function(err, user) {
            if (err) return done(Boom.badImplementation('', err))
            user.setDownload('', function() {
              user.saved_posts.push(post_id);
              user.save(function(err) {
                if (err) return done(Boom.badImplementation('', err))
                return done(null)
              })
            })
          })
        },
        function(done) {
          saved.save(function(err) {
            if (err) return done(Boom.badImplementation('', err))
            return done(null, saved)
          });
        }
      ], done)
    }
  ], function(err, saved) {
    if (err) return callback(err)
    return callback(null, saved);
  })
}
