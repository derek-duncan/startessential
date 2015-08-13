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
var toobusy = require('toobusy-js');
var migrate = require('migrate');

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

  // Migrate database
  var set = migrate.load(__dirname + '/.migrate', __dirname + '/migrations');
  if ( set.migrations.length ) {
    set.up(function (err) {
      if (err) throw err;

      server.log(['migrations'], 'Migration completed');
    });
  }

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
    if (process.env.NODE_ENV === 'production') {
      if (response.isBoom && response.output.statusCode === 403) {
        return reply.view('403');
      }
      if (response.isBoom && response.output.statusCode === 404) {
        return reply.view('404');
      }
      if (response.isBoom && response.output.statusCode === 500) {
        return reply.view('500');
      }
    }
    if (response.variety === 'view' && response.source.context) {
      var context = response.source.context;

      // Check to make sure we aren't too busy
      toobusy.maxLag(503)
      if (toobusy()) {
        return reply.view('503');
      }

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
      context.stripe_key_pk = constants.STRIPE_KEY_PK;

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

  var cookieSecure = process.env.NODE_ENV === 'production' ? true : false;
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
      password: constants.cookiePass,
      cookie: 'sid',
      redirectTo: '/login' + _message('Please login to access this content'),
      isSecure: cookieSecure,
      redirectOnTry: false,
      ttl: (60 * 1000) /* seconds */ * 60 /* minutes */ * 24 /* hours */ * 7 /* days */,
      validateFunc: function(session, callback) {
        validateUser.validate(session._id, {}, callback)
      }
    });
  });

  // Trial strategy

  server.register({
    register: require('lib/middleware/trial'),
    options: {
      redirectTo: '/register/finish' + _message('Please add payment information to continue using Start Essential')
    }
  }, function (err) {

  });

  // Facebook login strategy
  server.register(require('bell'), function (err) {
    server.auth.strategy('facebook', 'bell', {
      provider: 'facebook',
      password: constants.cookiePass,
      clientId: constants.FB_APP_ID,
      clientSecret: constants.FB_APP_SECRET,
      providerParams: {
        display: 'popup'
      },
      isSecure: cookieSecure,
      scope: ['email', 'public_profile', 'user_friends']
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
          request: '*',
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
