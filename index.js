"use strict";

require('newrelic');
var _ = require('lodash')
var constants = require('lib/constants')
var async = require('async')
var mongoose = require('mongoose')
var _message = require('lib/util/createMessage')

var Hapi = require('hapi');
var Good = require('good');
var routes = require('lib/routes/index.js');
var fs = require('fs');
var cluster = require('cluster');
var blocked = require('blocked');

var env = process.env.NODE_ENV || 'development';

if (cluster.isMaster) {
  var workers = process.env.WEB_CONCURRENCY || 1;;
  for (var i = 0; i < workers; i++) {
    cluster.fork();
  }
  cluster.on('exit', function() {
    console.log('A worker process died, restarting...');
    cluster.fork();
  });
} else {
  var server = new Hapi.Server()

  // Connect to mongodb
  var connect = function () {
    var options = { server: { socketOptions: { keepAlive: 1 } } };
    mongoose.connect(constants.database[env].url, options);
  };
  connect();

  mongoose.connection.on('error', server.log);
  mongoose.connection.on('disconnected', connect);

  // Bootstrap models
  fs.readdirSync(__dirname + '/lib/models').forEach(function (file) {
    if (file.indexOf('.js') >= 0) require(__dirname + '/lib/models/' + file);
  });

  // Bootstrap cron jobs
  fs.readdirSync(__dirname + '/lib/cron').forEach(function (file) {
    if (file.indexOf('.js') >= 0) require(__dirname + '/lib/cron/' + file);
  });

  var port = constants.application[env].port;
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

  var User = mongoose.model('User');
  var validateUser = require('lib/util/validateUser');

  server.ext('onRequest', function(request, reply) {
    // create a redirect url
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

      // Attach the sid cookie to every view
      if (request.state.sid && context) {
        context.sid = request.state.sid;
      }

      // Add Helpers for Jade templates
      fs.readdirSync(__dirname + '/views/helpers').forEach(function (file) {
        if (file.indexOf('.js') >= 0 && context) {
          var name = file.split('.')[0];
          context[name] = require(__dirname + '/views/helpers/' + file);
        }
      });

      // Add Message to Jade templates
      var validator = require('validator');
      var queryMessage = request.query.message;
      if (queryMessage) {
        context.message = validator.escape(queryMessage)
      }

      // Add FB App id to templates
      context.fb_app_id = constants.FB_APP_ID;

      // Trigger request logging
      var exclude = ['css', 'images', 'js', 'fonts']
      var path_start = request.path.split('/')[1]
      if (!_.includes(exclude, path_start)) {
        var sid = request.state.sid || {}
        request.log(['request', 'uid'], sid._id)
      }
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

        if (!token) return callback(null, false)

        User.decode(token, function(err, decoded) {
          validateUser.validate(decoded.uid, { token: token }, callback)
        })
      }
    });
  });

  // Cookie strategy

  server.register(require('hapi-auth-cookie'), function (err) {
    server.auth.strategy('session', 'cookie', {
      password: 'secret',
      cookie: 'sid',
      redirectTo: '/login' + _message('Please login to access this content'),
      isSecure: false,
      redirectOnTry: false,
      ttl: (60 * 1000) /* seconds */ * 60 /* minutes */ * 24 /* hours */ * 7 /* days */,
      validateFunc: function(session, callback) {
        validateUser.validate(session._id, {}, callback)
      }
    });
  });

  // Facebook login strategy
  server.register(require('bell'), function (err) {
    server.auth.strategy('facebook', 'bell', {
      provider: 'facebook',
      password: 'my_secret',
      clientId: constants.FB_APP_ID,
      clientSecret: constants.FB_APP_SECRET,
      providerParams: {
        display: 'popup'
      },
      isSecure: false,     // Terrible idea but required if not using HTTPS
      scope: ['email', 'public_profile', 'user_friends', 'publish_actions']
    });
  });

  // Default auth
  server.auth.default({
    strategy: 'session',
    scope: constants.SCOPE.PRE_AUTHENTICATED
  })

  // Add Crumb plugin

  server.register({ register: require('crumb'), options: {}}, function (err) {
    if (err) {
      server.log(['error', 'crumb'], err)
    }
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

  // Cookie definitions
  var cookiePassword = 'qowrDS&_(R)E(*#)(*WDFF)';

  server.state('se_register', {
    encoding: 'iron',
    password: cookiePassword,
    path: '/',
    ignoreErrors: false,
    clearInvalid: true
  })

  // Register logger
  server.register({
    register: Good,
    options: {
      reporters: [{
        reporter: require('good-console'),
        events: {
          response: '*',
          log: '*',
          error: '*'
        }
      },{
        reporter: require('good-file'),
        events: {
          request: '*'
        },
        config: './log/application.log',
      },{
        reporter: require('good-file'),
        events: {
          error: '*'
        },
        config: './log/error.log',
      },{
        reporter: require('good-file'),
        events: {
          log: '*'
        },
        config: './log/log.log',
      }],
      filter: {
        key: 'api_token',
        value: 'censor'
      }
    }
  }, function (err) {
    if (err) {
      throw err; // something bad happened loading the plugin
    }
  });

  // Start server
  server.start(function () {
    server.log('info', 'Server running at: ' + server.info.uri);
  });
}
