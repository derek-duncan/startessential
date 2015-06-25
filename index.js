"use strict";

var _ = require('lodash')
var CONSTANTS = require('_/config/constants')
var async = require('async')
var mongoose = require('mongoose')

var Hapi = require('hapi');
var Good = require('good');
var routes = require('_/routes/index.js');
var fs = require('fs');

var server = new Hapi.Server()

// Connect to mongodb
var connect = function () {
  var options = { server: { socketOptions: { keepAlive: 1 } } };
  mongoose.connect(CONSTANTS.database['database'], options);
};
connect();

mongoose.connection.on('error', console.log);
mongoose.connection.on('disconnected', connect);

// Bootstrap models
fs.readdirSync(__dirname + '/lib/models').forEach(function (file) {
  if (file.indexOf('.js') >= 0) require(__dirname + '/lib/models/' + file);
});

// Bootstrap cron jobs
fs.readdirSync(__dirname + '/lib/cron').forEach(function (file) {
  if (file.indexOf('.js') >= 0) require(__dirname + '/lib/cron/' + file);
});

var port = 3000;
server.connection({
  port: port
});

server.views({
  engines: {
    jade: require('jade')
  },
  isCached: false,
  relativeTo: __dirname,
  path: './views',
  helpersPath: './views/helpers'
});

server.ext('onRequest', function(request, reply) {
  if (request.url.path == '/login' && request.headers.referer) {
    var referer_url = request.headers.referer.split('/').slice(3);
    var redirect_url = '/' + referer_url.join('/');
    request.setUrl('/login?redirect=' + redirect_url);
  }
  return reply.continue();
});

server.ext('onPreResponse', function(request, reply) {

  var response = request.response;
  if (response.variety === 'view') {
    var context = response.source.context;

    // Add Helpers for Jade templates
    fs.readdirSync(__dirname + '/views/helpers').forEach(function (file) {
      if (file.indexOf('.js') >= 0 && context) {
        var name = file.split('.')[0];
        context[name] = require(__dirname + '/views/helpers/' + file);
      }
    });

    if (request.state.sid && context) {
      context.sid = request.state.sid;
    }

    // Add Message to Jade templates
    var validator = require('validator');
    var queryMessage = request.query.message;
    if (queryMessage) {
      context.message = validator.escape(queryMessage)
    }
    return reply.continue();
  }
  return reply.continue();
});

// Authentication strategy
server.register(require('hapi-auth-bearer-token'), function (err) {

  server.auth.strategy('simple', 'bearer-access-token', {
    allowQueryToken: true,
    allowMultipleHeaders: false,
    accessTokenName: 'access_token',
    validateFunc: function(token, callback) {

      var request = this;
      var User = mongoose.model('User')

      if (!token) return callback(null, false)

      User.decode(token, function(err, decoded) {
        User.findOne({_id: decoded.uid}, function(err, user) {
          if (user) {
            var scopeIsValid = user.scope === decoded.scope
            if (scopeIsValid) {
              var scope = []
              switch (decoded.scope) {
                case 'pre_authenticated':
                  scope = ['pre_authenticated']
                  break;
                case 'authenticated':
                  scope = ['pre_authenticated', 'authenticated']
                  break;
                case 'admin':
                  scope = ['pre_authenticated', 'authenticated', 'admin']
                  break;
                default:
                  scope = ['pre_authenticated']
                  break;
              }
              return callback(null, true, {
                scope: scope,
                token: token
              })
            }
          }
          return callback(null, false)
        })
      })
    }
  });
});

// Cookie strategy

server.register(require('hapi-auth-cookie'), function (err) {
  server.auth.strategy('session', 'cookie', {
    password: 'secret',
    cookie: 'sid',
    redirectTo: '/login',
    isSecure: false,
    redirectOnTry: false,
    validateFunc: function(session, callback) {
      var User = mongoose.model('User');
      User.findOne({_id: session._id}, function(err, user) {
        if (err) return callback(err)
        if (!user) return callback(null, false)
        if (user.scope === 'admin') {
          return callback(null, true, {
            scope: ['pre_authenticated', 'authenticated', 'admin']
          })
        } else if (user.scope === 'pre_authenticated') {
          return callback(null, true, {
            scope: ['pre_authenticated', 'admin']
          })
        } else {
          return callback(null, true, {
            scope: ['pre_authenticated', 'authenticated']
          })
        }
        return callback(null, false)
      })
    }
  });
});

// Facebook login strategy
server.register(require('bell'), function (err) {
  server.auth.strategy('facebook', 'bell', {
    provider: 'facebook',
    password: 'my_secret',
    clientId: '1589098114709228',
    clientSecret: '7fc1cf34eb3fe7daa129331790276b8b',
    providerParams: {
      display: 'popup'
    },
    isSecure: false,     // Terrible idea but required if not using HTTPS
    scope: ['email', 'public_profile', 'user_friends', 'publish_actions']
  });
});


// Add all the routes within the routes folder
// API routes
server.register({register: require('./lib/routes/api')}, function(err) {
  if (err) server.log('error', err)
})
// Index routes
server.register({register: require('./lib/routes/index')}, function(err) {
  if (err) server.log('error', err)
})
// App routes
server.register({register: require('./lib/routes/app')}, function(err) {
  if (err) server.log('error', err)
})

server.auth.default({
  strategy: 'session',
  scope: 'pre_authenticated'
})

module.exports = server;

server.register({
  register: Good,
  options: {
    reporters: [{
      reporter: require('good-console'),
      events: {
        response: '*',
        log: '*',
        error: '*',
        request: '*'
      }
    }]
  }
}, function (err) {
  if (err) {
    throw err; // something bad happened loading the plugin
  }
});

server.start(function () {
  server.log('info', 'Server running at: ' + server.info.uri);
});
