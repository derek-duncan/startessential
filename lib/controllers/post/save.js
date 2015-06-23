
var Saved, // Saved model
    Post, // Post model
    User, // User model
    Boom,
    moment,
    uploader,
    Overlayer,
    _message,
    _,
    CONSTANTS,
    async,
    mongoose;

_ = require('lodash')
CONSTANTS = require('_/constants')
async = require('async')
mongoose = require('mongoose')
Saved = mongoose.model('Saved');
Post = mongoose.model('Post');
User = mongoose.model('User');
Boom = require('boom')
moment = require('moment');
uploader = require('_/util/uploader');
Overlayer = require('_/util/overlay');
_message = require('_/util/createMessage')

module.exports = {
  index: index,
  preview: preview,
  save: save,
  publish: publish,
  remove: remove,
  generate: generate
}

function index(request, reply) {
  Saved.find({_user: request.state.sid._id}).populate('_post').exec(function(err, saved) {
    if (err) return reply(Boom.badImplementation('', err))
    return reply.view('app/saved', {
      saved: saved,
      active: 'saved'
    })
  })
}

function preview(request, reply) {
  var saved_code = request.params.saved_code;
  Saved.findOne({short_code: saved_code}).populate('_post _user').exec(function(err, graphic) {
    if (err) return done(Boom.badImplementation('', err))
    if (!graphic) return done(Boom.notFound())
    return reply.view('app/preview', {
      graphic: graphic
    })
  })
}

function save(request, reply) {
  var post_id = request.params.id;
  generate(post_id, request.state.sid._id, false, function(err, saved) {
    if (err) return reply(err)
    User.findOne({_id: request.state.sid._id}, function(err, user) {
      request.auth.session.set(user);
      return reply.redirect('/preview/' + saved.short_code + _message('Successfully saved post'));
    })
  })
}

function publish(request, reply) {
  var saved_code = request.params.saved_code;
  Saved.findOne({ short_code: saved_code }, function(err, saved) {
    if (err) return reply(Boom.wrap(err, 500))
    if (!saved) return reply(Boom.notFound('This post has not been saved by you yet.'))

    if (saved._user.equals(request.state.sid._id)) {
      saved.posted = true;
      saved.save();
      User.findOne({_id: request.state.sid._id}, function(err, user) {
        request.auth.session.set(user);
        return reply.redirect('/posts' + _message('Successfully posted to facebook'))
      })
    } else {
      return reply(Boom.forbidden('You are not the owner of this graphic'))
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
      post.customize(uid, function(err, details) {
        if (err) return done(Boom.badImplementation('', err))
        return done(null, details)
      })
    },
    function(details, done) {
      var saved = new Saved();
      saved._user = uid;
      saved._post = post_id;
      saved.custom_image.key = details.Key;
      saved.custom_image.url = details.Location;
      saved.isOld = false;
      if (isPosted) saved.posted = true;
      async.waterfall([
        function(done) {
          User.findOne({_id: uid}, function(err, user) {
            if (err) return done(Boom.badImplementation('', err))
            user.setDownload('', function(available) {
              if (available) {
                user.saved_posts.push(post_id);
                user.save(function(err) {
                  if (err) return done(Boom.badImplementation('', err))
                  return done(null)
                })
              } else {
                return done(Boom.forbidden('You do not have any more downloads left'))
              }
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
