var _ = require('lodash')
var async = require('async')
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Post = mongoose.model('Post');
var Saved = mongoose.model('Saved');
var Tag = mongoose.model('Tag');
var Boom = require('boom');
var moment = require('moment');
var Email = require('lib/util/email')
var UtilImage = require('lib/util/image');
var constants = require('lib/constants');

module.exports = {
  index: index,
  findOne: findOne,
  findAll: findAll,
  update: update,
  create: create,
  createSiteForUser: createSiteForUser
}

function index(request, reply) {
  async.waterfall([
    function(done) {
      User.find({ deleted: false }).sort({date_created: 'desc'}).populate('site').exec(function(err, users) {
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

function createSiteForUser(request, reply) {
  var user_id = request.payload.user_id;
  async.waterfall([
    function(done) {
      User.findOne({_id: user_id}).exec(function(err, user) {
        if (err) return done(Boom.badImplementation('', err));
        if (!user) return done(Boom.notFound());
        return done(null, user);
      });
    },
    function(user, done) {
      user.createSite(function(err) {
        if (err) return done(Boom.badImplementation('', err));
        return done(null)
      });
    }
  ], function(err) {
    if (err) return reply(err);
    return reply.redirect('/admin');
  });
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
    if (err) return reply(err)
    var tagsString = _.map(tags, function(tag) {
      return tag.name
    }).join(',');

    return reply.view('admin/post.jade', {
      post: post,
      tags: tagsString,
      categories: constants.CATEGORIES
    })
  })
}

function findAll(request, reply) {
  async.waterfall([
    function(done) {
      Post.find({}).sort({date_created: 'desc'}).exec(function(err, posts) {
        if (err) return done(Boom.wrap(err, 500))

        async.map(posts, function(post, done) {
          Saved.count({ _post: post._id }, function(err, count) {
            post.saves = count;
            return done(null, post);
          })
        }, function(err, results) {
          console.log(results)
          return done(null, results)
        })
      });
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
        post.free = request.payload.free === 'on' ? true : false

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
      if (!request.payload.image.hapi.filename.length) return done(null, post);

      // Initiate the image
      const Image = new UtilImage.Image(request.payload.image, { filename: request.payload.image.hapi.filename });
      // Create all the versions
      return Promise.all([
        Image.createVersion({
          size: 1500,
          quality: 95,
          name: 'original',
          copywrite: false
        }),
        Image.createVersion({
          size: 1200,
          quality: 85,
          name: 'normal',
          copywrite: true
        }),
        Image.createVersion({
          size: 400,
          quality: 75,
          name: 'small',
          copywrite: true
        })
      ]).then(versions => {
        // Upload the images
        const S3Connection = new UtilImage.S3Connector();
        return Promise.all(
          versions.map(version => {
            return S3Connection.send(version.stream, { filename: version.filename, name: version.name });
          })
        )
      }).then(uploadDetails => {
        // Assign the uploaded image to the post
        uploadDetails = uploadDetails.reduce((obj, version) => {
          obj[version.name] = version;
          return obj;
        }, {});

        post.image = uploadDetails;
        return done(null, post);
      }).catch(err => {

        return done(err);
      });
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
        featured: request.payload.featured === 'on' ? true : false,
        options: {
          x: request.payload.pos_x,
          y: request.payload.pos_y
        },
        free: request.payload.free === 'on' ? true : false
      })
      if (request.payload.published === 'on') {
        post.published = true
        post.date_published = moment()
      }

      // Initiate the image
      const Image = new UtilImage.Image(request.payload.image, { filename: request.payload.image.hapi.filename });
      // Create all the versions
      return Promise.all([
        Image.createVersion({
          size: 1500,
          quality: 95,
          name: 'original',
          copywrite: false
        }),
        Image.createVersion({
          size: 1200,
          quality: 85,
          name: 'normal',
          copywrite: true
        }),
        Image.createVersion({
          size: 400,
          quality: 75,
          name: 'small',
          copywrite: true
        })
      ]).then(versions => {
        // Upload the images
        const S3Connection = new UtilImage.S3Connector();
        return Promise.all(
          versions.map(version => {
            return S3Connection.send(version.stream, { filename: version.filename, name: version.name });
          })
        )
      }).then(uploadDetails => {
        // Assign the uploaded image to the post
        uploadDetails = uploadDetails.reduce((obj, version) => {
          obj[version.name] = version;
          return obj;
        }, {});

        post.image = uploadDetails;
        return done(null, post);
      }).catch(err => {

        return done(err);
      });
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
