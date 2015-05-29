var mongoose = require('mongoose')
var async = require('async')
var _ = require('lodash')
var Joi = require('joi')
var Boom = require('boom')
var User = mongoose.model('User');
var Post = mongoose.model('Post');
var moment = require('moment');
var uploader = require('../util/uploader');

function findPost(request, reply) {
  var params = request.params;
  var date = moment(params.year + '/' + params.month + '/' + params.day).startOf('day'),
      tomorrow = moment(date).add(1, 'days');

  Post.findOne({
    date_created: {
      $gte: date.toDate(),
      $lt: tomorrow.toDate()
    }
  }, function(err, post) {
    if (err) return reply(Boom.wrap(err, 500))
    if (!post) return reply(Boom.notFound())
    // if (params.public === 'view') {
      reply.view('app/post_view', {
        post: post,
        title: post.title
      })
    // } else {
    //   if (request.query.access === post.share_token) {
    //     reply.view('app/post', {
    //       post: post,
    //       title: post.title
    //     })
    //   } else {
    //     reply(Boom.forbidden())
    //   }
    // }
  })
}

function findAllPosts(request, reply) {
  async.waterfall([
    function(done) {
      Post.find({}, function(err, posts) {
        if (err) return done(Boom.wrap(err, 500))
        return done(null, posts)
      })
    }
  ], function(err, posts) {
    if (err) reply(err)
    reply.view('app/posts', {
      posts: posts
    })
  })
}

function findAllPostsAdmin(request, reply) {
  async.waterfall([
    function(done) {
      Post.find({}, function(err, posts) {
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

function findPostAdmin(request, reply) {
  async.waterfall([
    function(done) {
      Post.findOne({_id: request.params.id}, function(err, post) {
        if (err) return done(Boom.wrap(err, 500))
        if (!post) return done(Boom.create(404, 'Could not find post'))
        return done(null, post)
      })
    }
  ], function(err, post) {
    if (err) reply(err)
    var date_format = post.date_created.toISOString().slice(0,10).replace(/-/g,"/");
    reply.view('admin/post.jade', {
      post: post,
      date: date_format
    })
  })
}

function updatePostAdmin(request, reply) {
  async.waterfall([
    function(done) {
      Post.findOne({_id: request.params.id}, function(err, post) {
        if (err) return done(Boom.wrap(err, 500))
        if (!post) return done(Boom.create(404, 'Could not find post'))
        post.title = request.payload.title;
        post.content = request.payload.content;
        post.day = request.payload.day;
        post.new_share_token = request.payload.new_share_token === 'on' ? true : false;
        return done(null, post)
      })
    }, function(post, done) {
      if (request.payload.image.hapi.filename.length) {
        uploader.image(request.payload.image, post.date_formatted, function(err, image_url) {
          if (err) return done(err)
          post.image_url = image_url
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
    if (err) reply(err)
    reply.redirect('/admin/posts/' + post._id)
  })
}

function createPostAdmin(request, reply) {
  async.waterfall([
    function(done) {
      var post = new Post({
        title: request.payload.title,
        content: request.payload.content,
        day: request.payload.day
      })
      uploader.image(request.payload.image, post.date_created, function(err, image_url) {
        if (err) return done(err)
        post.image_url = image_url
        return done(null, post)
      })
    },
    function(post, done) {
      post.save(function(err) {
        if (err) return done(Boom.wrap(err, 500))
        return done(null, post)
      })
    }
  ], function(err, post) {
    if (err) reply(err)
    reply.redirect('/admin/posts/' + post._id)
  })
}

function indexAdmin(request, reply) {
  async.waterfall([
    function(done) {
      User.find({}, function(err, users) {
        if (err) return done(Boom.wrap(err, 500));
        return done(null, users)
      })
    }
  ], function(err, users) {
    if (err) reply(err);
    reply.view('admin/index', {
      users: users
    });
  })
}

function loginFacebookUser(request, reply) {
  var profile = request.auth.credentials.profile;
  User.findOne({email: profile.email}, function(err, user) {
    if (err) return reply(Boom.wrap(err, 500))
    if (!user) {
      var newUser = new User({
        email: profile.email,
        first_name: profile.name.first,
        last_name: profile.name.last,
        facebook_connected: true,
        facebook_id: profile.id
      })
      newUser.save(function(err) {
        if (err) return reply(Boom.wrap(err, 500))
        request.auth.session.set(user);
        return reply.redirect('/posts');
      })
    } else {
      if (!user.facebook_connected) {
        user.first_name = user.first_name || profile.name.first;
        user.last_name = user.last_name || profile.name.last;
        user.facebook_connected = true;
        user.facebook_id = profile.id;
      }
      request.auth.session.set(user);
      return reply.redirect('/posts');
    }
  })
}

function logoutUser(request, reply) {
  request.auth.session.clear();
  return reply.redirect('/');
}

module.exports = {
  Post: {
    find: findPost,
    findAll: findAllPosts
  },
  Admin: {
    index: indexAdmin,
    findAllPosts: findAllPostsAdmin,
    findPost: findPostAdmin,
    updatePost: updatePostAdmin,
    createPost: createPostAdmin
  },
  User: {
    facebookLogin: loginFacebookUser,
    logout: logoutUser
  }
}
