'use strict';

var _ = require('lodash')
var constants = require('lib/constants')
var async = require('async')
var mongoose = require('mongoose')
var Saved = mongoose.model('Saved');
var Post = mongoose.model('Post');
var User = mongoose.model('User');
var Boom = require('boom')
var moment = require('moment');
var UtilImage = require('lib/util/image');
var Email = require('lib/util/email');
var _message = require('lib/util/createMessage')

module.exports = {
  viewAllSavedPosts: viewAllSavedPosts,
  previewSavedPost: previewSavedPost,
  savePost: savePost,
  removeSavedPost: removeSavedPost,
  generateImagesForSave: generateImagesForSave
}

function viewAllSavedPosts(request, reply) {
  Saved.find({_user: request.state.sid._id}).sort({date_created: 'desc'}).populate('_post').exec(function(err, saved) {
    if (err) return reply(Boom.badImplementation('', err))
    return reply.view('graphics/saved', {
      saved: saved,
      active: 'saved',
      title: 'Saved Graphics | Start Essential'
    })
  })
}

function previewSavedPost(request, reply) {
  var saved_code = request.params.saved_code;
  Saved.findOne({short_code: saved_code}).populate('_post _user').exec(function(err, graphic) {
    if (err) return reply(Boom.badImplementation('', err))
    if (!graphic) return reply(Boom.notFound())
    return reply.view('graphics/preview', {
      graphic: graphic,
      title: graphic._post.title + ' essential oil graphic - Start Essential'
    })
  })
}

function savePost(request, reply) {
  var post_id = request.params.id;
  var uid = request.state.sid._id;
  var resave = request.query.resave === 1 ? true : false;
  var lastPath = request.info.referrer.split('?')[0];
  User.findOne({_id: uid}).select('records email first_name').exec(function(err, user) {
    if (err) return reply(Boom.badImplementation('', err))
    if (!user) return reply(Boom.forbidden('User could not be found'))
    Post.findOne({ _id: post_id }).lean().exec(function(err, post) {
      if (!post) return reply.redirect(lastPath + _message('This graphic is not available'))
      if (!user.hasDownload() && !resave && !post.free) {
        return reply.redirect(lastPath + _message('No more downloads available'))
      }
      var generateOptions = {
        post_id: post_id,
        uid: user._id,
        resave: resave
      }
      generateImagesForSave(generateOptions, function(err, saved) {
        if (err) return reply(err)
        var emailTemplate = require('lib/util/email/templates/save-new-graphic');
        emailTemplate.locals = {
          email: user.email,
          fname: user.first_name,
          graphic_title: saved._post.title,
          saved_link: 'https://startessential.com/preview/' + saved.short_code
        }
        if (!generateOptions.resave) {
          Email.send(emailTemplate)
        }
        User.findOne({_id: uid}, function(err, user) {
          request.auth.session.set(user);
          return reply.redirect('/preview/' + saved.short_code + _message('Successfully saved post'));
        })
      })
    })
  })
}

function removeSavedPost(request, reply) {
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
function generateImagesForSave(options, callback) {
  options.post_id = options.post_id || '';
  options.uid = options.uid || '';
  options.resave = options.resave || false;
  async.waterfall([
    function(done) {
      async.parallel([
        function(done) {
          Saved.findOne({_post: options.post_id, _user: options.uid}, function(err, saved) {
            if (err) return done(Boom.badImplementation('', err))
            if (options.resave && !saved) return done(Boom.forbidden('This graphic has not been saved, so you may not resave it.'))
            if (saved) {
              // If we are resaving, let's delete the old saved entry and s3 objects
              if (options.resave) {
                async.each(_.keys(saved.custom_image), function(image, done) {
                  const Upload = new UtilImage.Upload();
                  let s3Key = saved.custom_image[image].Key;
                  let removeImage = Upload.remove(s3Key);
                  removeImage.then(() => {
                    return saved.remove(done);
                  }).catch(err => {
                    return done(err);
                  });
                }, function(err) {
                  return done();
                });
              } else {
                return callback(null, saved)
              }
            } else {
              return done()
            }
          })
        },
        function(done) {
          Post.findOne({_id: options.post_id}, function(err, post) {
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
      User.findOne({_id: options.uid}, function(err, user) {
        if (err) return done(err);

        const Image = new UtilImage.Image(post.image.original.Key);
        const emblemOptions = {
          x: post.options.x,
          y: post.options.y,
          emblemKey: user.emblem.Key
        };
        let image = Image.addUserEmblem(emblemOptions);
        image.then(stream => {

          return Promise.all([
            Image.createVersion({
              size: 1500,
              quality: 95,
              name: 'original'
            }),
            Image.createVersion({
              size: 1200,
              quality: 85,
              name: 'normal'
            }),
            Image.createVersion({
              size: 400,
              quality: 75,
              name: 'small'
            })
          ]);
        }).then(versions => {

          const Upload = new UtilImage.Upload();
          return Promise.all(
            versions.map(version => {
              return Upload.send(version.stream, { filename: version.filename });
            })
          )
        }).then(uploadDetails => {
          console.log(uploadDetails);
        });
        //var newUpload = new Upload({
        //  filename: post.image.original.Key
        //});
        //newUpload.customizeS3Image(customizeOptions, function(err, images) {
        //  return done(err, images, post);
        //});
      })
    },
    function(images, post, done) {
      var saved = new Saved();
      saved._user = options.uid;
      saved._post = options.post_id;
      saved.custom_image = {
        original: {
          Location: images.original.Location,
          Key: images.original.Key
        },
        normal: {
          Location: images.normal.Location,
          Key: images.normal.Key
        },
        small: {
          Location: images.small.Location,
          Key: images.small.Key
        }
      }
      saved.isOld = false;
      if (options.isPosted) saved.posted = true;
      async.waterfall([
        function(done) {
          User.findOne({_id: options.uid}, function(err, user) {
            if (err) return done(Boom.badImplementation('', err))
            var postPrice = post.free ? 'free' : '';
            user.setDownload(postPrice, function() {
              user.saved_posts.push(options.post_id);
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
