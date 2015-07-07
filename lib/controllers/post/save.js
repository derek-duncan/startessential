var _ = require('lodash')
var constants = require('lib/constants')
var async = require('async')
var mongoose = require('mongoose')
var Saved = mongoose.model('Saved');
var Post = mongoose.model('Post');
var User = mongoose.model('User');
var Boom = require('boom')
var moment = require('moment');
var uploader = require('lib/util/uploader');
var _message = require('lib/util/createMessage')

module.exports = {
  index: index,
  preview: preview,
  save: save,
  publish: publish,
  remove: remove,
  generate: generate
}

function index(request, reply) {
  Saved.find({_user: request.state.sid._id}).sort({date_created: 'desc'}).populate('_post').exec(function(err, saved) {
    if (err) return reply(Boom.badImplementation('', err))
    return reply.view('app/saved', {
      saved: saved,
      active: 'saved',
      title: 'Saved Graphics | Start Essential'
    })
  })
}

function preview(request, reply) {
  var saved_code = request.params.saved_code;
  Saved.findOne({short_code: saved_code}).populate('_post _user').exec(function(err, graphic) {
    if (err) return reply(Boom.badImplementation('', err))
    if (!graphic) return reply(Boom.notFound())
    console.log(graphic)
    return reply.view('app/preview', {
      graphic: graphic,
      title: graphic._post.title + ' essential oil graphic - Start Essential'
    })
  })
}

function save(request, reply) {
  var post_id = request.params.id;
  var uid = request.state.sid._id
  User.findOne({_id: uid}).select('records').exec(function(err, user) {
    if (err) return reply(Boom.badImplementation('', err))
    if (!user) return reply(Boom.forbidden('User could not be found'))
    if (user.hasDownload()) {
      generate(post_id, uid, false, function(err, saved) {
        if (err) return reply(err)
        User.findOne({_id: uid}, function(err, user) {
          request.auth.session.set(user);
          return reply.redirect('/preview/' + saved.short_code + _message('Successfully saved post'));
        })
      })
    } else {
      return reply.redirect(request.info.referrer.split('?')[0] + _message('No more downloads available'))
    }
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
