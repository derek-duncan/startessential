var mongoose = require('mongoose')
var async = require('async')
var _ = require('lodash')
var Joi = require('joi')
var Boom = require('boom')
var User = mongoose.model('User');
var Post = mongoose.model('Post');
var Saved = mongoose.model('Saved');
var moment = require('moment');
var uploader = require('../util/uploader');
var Overlayer = require('../util/overlay');
var Email = require('../util/email');
var Request = require('request');
var Constants = require('../constants');
var emails = require('../email');
var stripe = require('stripe')('sk_test_8T9RioM6rUcrweVcJ0VluRyG');

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
    if (request.state.sid) {
      User.findOne({_id: request.state.sid._id }, function(err, user) {
        if (err) return reply(Boom.wrap(err, 500))
        user = user || {}
        reply.view('app/post', {
          post: post,
          title: post.title,
          user: user,
          user_exists: true
        })
      })
    } else {
      reply.view('app/post', {
        post: post,
        title: post.title,
        user: {},
        user_exists: false
      })
    }
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
      Post.find({}).exclude('options token share_token').exec(function(err, posts) {
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

function allPostsView(request, reply) {
  async.waterfall([
    function(done) {
      async.parallel({
        posts: function(done) {
          Post.find({}).limit(3).exec(function(err, posts) {
            if (err) return done(Boom.wrap(err, 500))
            return done(null, posts)
          })
        },
        featured: function(done) {
          Post.findOne({ featured: true }, function(err, featured) {
            if (err) return done(Boom.badImplementation('', err))
            return done(null, featured)
          })
        }
      }, done)
    }, function(results, done) {
      async.each(Constants.CATEGORIES, function(category, done) {
        Post.find({category: category}).limit(3).exec(function(err, posts) {
          var obj = {}
          obj[category] = posts;
          results.categories = results.categories || {};
          _.extend(results.categories, obj)
          return done()
        })
      }, function(err) {
        return done(null, results)
      })
    }
  ], function(err, results) {
    if (err) reply(err)
    reply.view('app/posts', {
      featured: results.featured,
      posts: results.posts,
      categories: results.categories,
      active: 'explore'
    })
  })
}

function accountViewUser(request, reply) {
  User.findOne({_id: request.state.sid._id}, function(err, user) {
    if (err || !user) return reply(Boom.forbidden());
    return reply.view('app/account', {
      title: 'Your Start Essential Account',
      user: user,
      active: 'account'
    });
  })
}

function accountSettingsUser(request, reply) {
  if (request.state.sid._id === request.payload._id) {
    async.waterfall([
      function(done) {
        // This may possibly save before all the db requests finish
        User.findOne({ _id: request.payload._id }, function(err, user) {
          if (err) return done(Boom.badImplementation('', err))
          if (!user) return done(Boom.forbidden())
          if (user.member_number !== request.payload.memberNumber) {
            user.member_number = request.payload.memberNumber;
            Saved.update({_user: request.state.sid._id}, {$set: {isOld: true}}, function(err, numAffected) {
            })
          }

          if (user.email !== request.payload.email) {
            User.findOne({email: request.payload.email}, function(err, userExists) {
              if (userExists) {
                return done(Boom.conflict('That email address is already registered'))
              }
              Email.update(user.email, request.payload.email, user.stripe.id, function(err) {
                if (err) console.log(err)
                user.email = request.payload.email;
                return done(null, user)
              });
            })
          } else {
            return done(null, user)
          }
        })
      }
    ], function(err, user) {
      if (err) return reply(err);
      user.save(function() {
        return reply.redirect('/account')
      })
    })
  } else {
    return reply(Boom.forbidden())
  }
}

function accountRemoveUser(request, reply) {
  User.findOne({_id: request.payload._id}, function(err, user) {
    if (err || !user) return reply(Boom.forbidden());
    user.deleted = true;
    user.scope = 'pre_authenticated';
    Email.remove(user.email, function(err) {
    })
    stripe.customers.del(user.stripe.id);
    user.save(function() {
      return reply.redirect('/logout');
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
        post.category = request.payload.category;
        post.day = request.payload.day;
        post.new_share_token = request.payload.new_share_token === 'on' ? true : false;
        post.featured = request.payload.featured === 'on' ? true : false
        post.options.x = request.payload.pos_x
        post.options.y = request.payload.pos_y
        post.options.size = request.payload.font_size
        post.options.font = request.payload.font
        return done(null, post)
      })
    }, function(post, done) {
      if (request.payload.image.hapi.filename.length) {
        uploader.image(request.payload.image, request.payload.image.hapi.filename, post.date_formatted, function(err, details) {
          if (err) return done(err)
          post.image_url = details.Location
          post.image_key = details.Key
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

function createPostAdmin(request, reply) {
  async.waterfall([
    function(done) {
      var post = new Post({
        title: request.payload.title,
        content: request.payload.content,
        category: request.payload.category,
        day: request.payload.day,
        featured: request.payload.featured === 'on' ? true : false
      })
      uploader.image(request.payload.image, request.payload.image.hapi.filename, post.date_formatted, function(err, details) {
        if (err) return done(Boom.wrap(err, 500))
        post.image_url = details.Location
        post.image_key = details.Key
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
    if (err) return reply(err)
    return reply.redirect('/admin/posts/' + post._id)
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
    if (request.query.friend) {
      console.log(request.query.friend)
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

function registerWithStripe(request, reply) {
  if (request.method === 'get') {
    if (request.state.sid.scope !== 'pre_authenticated') {
      return reply.redirect('/login')
    }
    reply.view('register_finish', {
      title: 'Register for Start Essential',
      email: request.state.sid.email
    });
  }
  if (request.method === 'post') {

    User.findOne({ _id: request.state.sid._id }).select('stripe scope deleted').exec(function(err, user) {
      if (err) return reply(Boom.wrap(err, 500))
      if (!user) return reply(Boom.unauthorized('You must have an user account to setup payment'))

      var stripeData = {
        source: request.payload.stripeToken,
        plan: 'basic',
        email: request.state.sid.email
      }

      async.waterfall([
        function(done) {
          if (user.stripe.id) {
            stripeData.trial_end = 'now';
            stripe.customers.retrieve( user.stripe.id, function(err, customer) {
              if (customer && customer.deleted) {
                stripe.customers.create(stripeData, function(err, customer) {
                  if (err) reply(Boom.badImplementation())
                  return done(null, customer, false)
                })
              } else {
                stripe.customers.update( user.stripe.id, stripeData, function(err, customer) {
                  if (err) return done(Boom.badImplementation('', err))
                  return done(null, customer, false)
                });
              }
            })
          } else {
            stripe.customers.create(stripeData, function(err, customer) {
              if (err) reply(Boom.badImplementation())
              return done(null, customer, true)
            })
          }
        }
      ], function(err, customer, isNew) {
        if (err) return reply(err)

        if (isNew) {
          user.stripe.date = Date.now();
        }
        user.stripe.id = customer.id;
        user.stripe.subscription = customer.subscriptions.data[0].plan.id
        user.stripe.subscription_id = customer.subscriptions.data[0].id
        user.scope = 'authenticated';
        user.deleted = false; // just incase they are reactivating their account
        user.save()
        return reply.redirect('/thankyou')
      })

    })
  }
}

function loginFacebookUser(request, reply) {
  var profile = request.auth.credentials.profile;

  async.waterfall([
    function(done) {
      User.findOne({ facebook_id: profile.id }).select('-stripe').exec(function(err, user) {
        if (err) return reply(Boom.badImplementation())
        if (!user) return reply.redirect('/register' + _message('You are not registered'))

        request.auth.session.set(user);

        if (user.scope === 'pre_authenticated') {
          return reply.redirect('/register/finish' + _message('Please add payment information'))
        }
        return done(null)
      })
    }
  ], function(err) {
    if (err) return reply(err)
    if (request.query.redirect) {
      return reply.redirect(redirect)
    } else {
      return reply.redirect('/posts')
    }
  })
}

function registerFacebookUser(request, reply) {
  var profile = request.auth.credentials.profile;
  console.log(request.state)
  var memberNumber = request.state.se_member_number || null;

  async.waterfall([
    function(done) {
      User.findOne({email: profile.email}, function(err, user) {
        if (err) return reply(Boom.wrap(err, 500))
        if (!user) {
          var newUser = new User({
            email: profile.email,
            first_name: profile.name.first,
            last_name: profile.name.last,
            facebook_connected: true,
            facebook_id: profile.id,
            member_number: memberNumber
          })
          Email.save({ email: newUser.email, name: newUser.full_name }, function(err) {
            if (err) console.log(Boom.wrap(err, 500));
          })
          Email.send(newUser.email, emails.NEW_USER(), function(err) {
            if (err) console.log(Boom.wrap(err, 500));
          })
          return done(null, newUser, true)
        } else {
          return done(null, user, false)
        }
      })
    }, function(user, isNew, done) {
      if (isNew) {
        if (request.state.friend) {
          User.findOne({ referral_id: request.state.friend }, function(err, friend_user) {
            if (err) return done(Boom.wrap(err, 500))
            if (!friend_user) return done(null, user, isNew) // if the friend doesnt exist, just create a new account

            friend_user.friends.push(user._id);
            user.friend = friend_user._id;
            user.addFreeMonth();

            friend_user.save(function(err) {
              if (err) return done(Boom.wrap(err, 500))
              return done(null, user, isNew);
            })
          })
        } else {
          return done(null, user, isNew)
        }
      } else {
        return done(null, user, isNew)
      }
    }, function(user, isNew, done) {
      if (isNew) {
        user.token = request.auth.credentials.token;
        user.save(function(err) {
          if (err) return reply(Boom.wrap(err, 500))
          request.auth.session.set(user);
          return reply.redirect('/register/finish').unstate('friend');
        })
      } else {
        request.auth.session.set(user);
        return reply.redirect('/facebook/login')
      }
    }
  ])
}

function logoutUser(request, reply) {
  request.auth.session.clear();
  return reply.redirect('/');
}

function publishToFacebook(request, reply) {
  var post_id = request.params.post_id;
  Post.findOne({ _id: post_id }, function(err, post) {
    if (err) return reply(Boom.wrap(err, 500))
    if (!post) return reply(Boom.notFound())
    var fb_id = request.state.sid.facebook_id;
    var member_number = request.state.sid.member_number;

    _savePost(post._id, request.state.sid._id, true, function(err, saved) {
      if (err) return reply(err)

      var content;
      if (member_number) {
        content =
          post.title +
          '\n\n' +
          post.content +
          '\n\n' +
          'Sign up with me at https://www.youngliving.com/signup/?site=US&sponsorid='+member_number+'&enrollerid='+member_number;
      } else {
        content =
          post.title +
          '\n\n' +
          post.content;
      }
      var fbPost = {
        caption: content,
        url: saved.custom_image.url,
        access_token: request.state.sid.token
      }
      Request.post({ url: 'https://graph.facebook.com/v2.3/' + fb_id + '/photos', form: fbPost }, function(err, res, body) {
        if (err) return reply(Boom.wrap(err, 500))
        User.findOne({_id: request.state.sid._id}, function(err, user) {
          request.auth.session.set(user);
          return reply.redirect('/posts' + _message('Successfully posted to facebook'))
        })
      })
    })
  })
}

function savedPostView(request, reply) {
  Saved.find({_user: request.state.sid._id}).populate('_post').exec(function(err, saved) {
    if (err) return reply(Boom.badImplementation('', err))
    return reply.view('app/saved', {
      saved: saved,
      active: 'saved'
    })
  })
}

function _savePost(post_id, uid, isPosted, callback) {
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

function savePostUser(request, reply) {
  var post_id = request.params.id;
  _savePost(post_id, request.state.sid._id, false, function(err, saved) {
    if (err) return reply(err)
    User.findOne({_id: request.state.sid._id}, function(err, user) {
      request.auth.session.set(user);
      return reply.redirect('/preview/' + saved.short_code + _message('Successfully saved post'));
    })
  })
}

function saveRemovePostUser(request, reply) {
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

function previewPostView(request, reply) {
  var saved_code = request.params.saved_code;
  Saved.findOne({short_code: saved_code}).populate('_post _user').exec(function(err, graphic) {
    if (err) return done(Boom.badImplementation('', err))
    if (!graphic) return done(Boom.notFound())
    return reply.view('app/preview', {
      graphic: graphic
    })
  })
}

function _message(msg) {
  return '?message=' + encodeURIComponent(msg);
}

module.exports = {
  Post: {
    find: findPost,
    findAll: findAllPosts,
    publishToFacebook: publishToFacebook,
    allPosts: allPostsView,
    saved: savedPostView,
    preview: previewPostView
  },
  Admin: {
    index: indexAdmin,
    findAllPosts: findAllPostsAdmin,
    findPost: findPostAdmin,
    updatePost: updatePostAdmin,
    createPost: createPostAdmin
  },
  User: {
    stripeRegister: registerWithStripe,
    facebookRegister: registerFacebookUser,
    facebookLogin: loginFacebookUser,
    logout: logoutUser,
    accountView: accountViewUser,
    accountSettings: accountSettingsUser,
    accountRemove: accountRemoveUser,
    savePost: savePostUser,
    saveRemovePost: saveRemovePostUser
  }
}
