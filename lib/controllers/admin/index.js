var _ = require('lodash')
var async = require('async')
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Post = mongoose.model('Post');
var Tag = mongoose.model('Tag');
var Boom = require('boom');
var moment = require('moment');
var Email = require('lib/util/email')
var Upload = require('lib/util/image');

module.exports = {
  index: index,
  findOne: findOne,
  findAll: findAll,
  update: update,
  create: create
}

function index(request, reply) {
  async.waterfall([
    //function(done) {
    //  var template = require('lib/util/email/templates/welcome-email')

    //  template.locals = {
    //    email: 'mail-spam@derekduncan.me',
    //    fname: 'Derek',
    //    lname: 'Duncan'
    //  }
    //  Email.send(template, function(err, result) {
    //    return done(err)
    //  })
    //},
    function(done) {
      User.find({}, function(err, users) {
        if (err) return done(Boom.wrap(err, 500));
        return done(null, users)
      })
    }
  ], function(err, users) {
    if (err) reply(err);
    if (request.query.friend) {
      reply.view('admin/index', {
        users: users
      }).state('friend', request.query.friend);
    } else {
      reply.view('admin/index', {
        users: users
      });
    }
  })
}

function findOne(request, reply) {
  async.waterfall([
    function(done) {
      Post.findOne({_id: request.params.id}).populate('tags').exec(function(err, post) {
        if (err) return done(Boom.wrap(err, 500))
        if (!post) return done(Boom.create(404, 'Could not find post'))
        return done(null, post)
      })
    },
    function(post, done) {
      Tag.find().exec(function(err, tags) {
        if (err) return done(err)
        return done(null, post, tags)
      })
    }
  ], function(err, post, tags) {
    if (err) reply(err)
    var date_format = post.date_created.toISOString().slice(0,10).replace(/-/g,"/");
    var tagsString = _.map(tags, function(tag) {
      return tag.name
    }).join(',');

    reply.view('admin/post.jade', {
      post: post,
      tags: tagsString,
      date: date_format
    })
  })
}

function findAll(request, reply) {
  async.waterfall([
    function(done) {
      Post.find({}).sort({date_created: 'desc'}).exec(function(err, posts) {
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

function update(request, reply) {
  async.waterfall([
    function(done) {
      Post.findOne({_id: request.params.id}, function(err, post) {
        if (err) return done(Boom.wrap(err, 500))
        if (!post) return done(Boom.create(404, 'Could not find post'))
        post.title = request.payload.title;
        post.short_description = request.payload.short_description;
        post.content = request.payload.content;
        post.category = request.payload.category;
        post.day = request.payload.day;
        post.featured = request.payload.featured === 'on' ? true : false
        if (request.payload.published === 'on') {
          post.published = true
          post.date_published = moment()
        } else {
          post.published = false
        }
        post.options.x = request.payload.pos_x
        post.options.y = request.payload.pos_y

        var tags = request.payload.tags.split(',');
        var newTags = [];
        if (tags.length) {
          async.each(tags, function(tagName, done) {
            if (post.tags.indexOf(tagName) === -1) {
              Tag.createOrFind(tagName, function(err, tag) {
                newTags.push(tag._id);
                return done(err);
              })
            }
          }, function(err) {
            post.tags = newTags;
            return done(null, post)
          })
        }
      })
    }, function(post, done) {
      if (request.payload.image.hapi.filename.length) {
        var newUpload = new Upload({
          filename: request.payload.image.hapi.filename
        })
        newUpload.createImage(request.payload.image, function(err, images) {
          if (err) return done(err)
          post.image.original = images.original
          post.image.small = images.small
          post.image.normal = images.normal
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
    if (err) return reply(err)
    return reply.redirect('/admin/posts/' + post._id)
  })
}

function create(request, reply) {
  async.waterfall([
    function(done) {
      var post = new Post({
        title: request.payload.title,
        short_description: request.payload.short_description,
        content: request.payload.content,
        category: request.payload.category,
        day: request.payload.day,
        featured: request.payload.featured === 'on' ? true : false
      })
      if (request.payload.published === 'on') {
        post.published = true
        post.date_published = moment()
      }

      var newUpload = new Upload({
        filename: request.payload.image.hapi.filename
      })
      newUpload.createImage(request.payload.image, function(err, images) {
        if (err) return done(err)
        post.image.original = images.original
        post.image.small = images.small
        post.image.normal = images.normal
        return done(null, post)
      })
    },
    function(post, done) {
      var tags = request.payload.tags.split(',');
      if (tags.length) {
        async.each(tags, function(tagName, done) {
          if (post.tags.indexOf(tagName) === -1) {
            Tag.createOrFind(tagName, function(err, tag) {
              post.tags.push(tag._id);
              return done(err);
            })
          }
        }, function(err) {
          return done(null, post)
        })
      }
    },
    function(post, done) {
      post.save(function(err) {
        if (err) return done(Boom.wrap(err, 500))
        return done(null, post)
      })
    }
  ], function(err, post) {
    if (err) return reply(err)
    return reply.redirect('/admin/posts/' + post._id)
  })
}
