"use strict";

require('newrelic');
var Hapi = require('hapi');
var cluster = require('cluster');
var toobusy = require('toobusy-js');
var mongoose = require('mongoose')
var migrate = require('migrate');
var Good = require('good');
var path = require('path');
var fs = require('fs');

var constants = require('lib/constants')
var _message = require('lib/util/createMessage')

// ======================

// Fork the process on production
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
  constants.appRoot = path.resolve(__dirname);

  var server = new Hapi.Server()

  server.connection({
    port: constants.application[ constants.application.env ].port
  });

  server.views({
    engines: {
      jade: {
        module: require('jade'),
        compileOptions: {
          basedir: path.resolve('lib/views/util')
        }
      }
    },
    isCached: false,
    path: path.resolve('lib/views')
  });

  // ======================

  // Connect to mongodb
  var connect = function () {
    var options = { server: { socketOptions: { keepAlive: 1 } } };
    mongoose.connect(constants.database[ constants.application.env ].url, options);
  };
  connect();

  mongoose.connection.on('error', server.log);
  mongoose.connection.on('disconnected', connect);

  // ======================

  // Bootstrap models
  fs.readdirSync(__dirname + '/lib/models').forEach(function (file) {
    if (file.indexOf('.js') >= 0) require(__dirname + '/lib/models/' + file);
  });

  // Bootstrap cron jobs
  fs.readdirSync(__dirname + '/lib/cron').forEach(function (file) {
    if (file.indexOf('.js') >= 0) require(__dirname + '/lib/cron/' + file);
  });

  // ======================

  // Migrate database
  var set = migrate.load(__dirname + '/.migrate', __dirname + '/migrations');
  if ( set.migrations.length ) {
    set.up(function (err) {
      if (err) throw err;

      server.log(['migrations'], 'Migration completed');
    });
  }

  // ======================

  var middleware = require('lib/middleware');

  // Load middleware

  server.register([
    {
      register: middleware.request.redirect,
      options: {}
    },
    {
      register: middleware.response.errorPages,
      options: {}
    },
    {
      register: middleware.response.toobusy,
      options: {}
    },
    {
      register: middleware.response.locals,
      options: {}
    },
    {
      register: middleware.response.logging,
      options: {}
    },
    {
      register: middleware.trial,
      options: {
        redirectTo: '/register/finish' + _message('Please add payment information to continue using Start Essential')
      }
    }
  ], function (err) {
    if (err) console.error('Failed to load a plugin:', err);
  }); // middleware register

  // ======================

  var User = mongoose.model('User');

  // Authentication strategy
  server.register(require('hapi-auth-bearer-token'), function (err) {

    server.auth.strategy('simple', 'bearer-access-token', {
      allowQueryToken: true,
      allowMultipleHeaders: false,
      accessTokenName: 'access_token',
      validateFunc: middleware.validate.bearerToken.validate
    });
  });

  // ======================

  // Cookie strategy
  server.register(require('hapi-auth-cookie'), function (err) {
    server.auth.strategy('session', 'cookie', {
      password: constants.cookiePass,
      cookie: 'sid',
      redirectTo: '/login' + _message('Please login to access this content'),
      isSecure: constants.cookieSecure,
      redirectOnTry: false,
      ttl: (60 * 1000) /* seconds */ * 60 /* minutes */ * 24 /* hours */ * 7 /* days */,
      validateFunc: middleware.validate.sessionCookie.validate
    });
  });

  // ======================

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
      isSecure: constants.cookieSecure,
      scope: ['email', 'public_profile', 'user_friends']
    });
  });

  // ======================

  // Default auth
  server.auth.default({
    strategy: 'session',
    scope: constants.SCOPE.PRE_AUTHENTICATED
  })

  // ======================

  // Add Crumb plugin
  server.register({ register: require('crumb'), options: {}}, function (err) {
    if (err) {
      server.log(['error', 'crumb'], err)
    }
  });

  // ======================

  // Add all the routes within the routes folder
  var routes = require('lib/routes');
  // API routes
  server.register({register: routes.api}, function(err) {
    if (err) server.log('error', err)
  })
  // Core routes
  server.register({register: routes.core}, function(err) {
    if (err) server.log('error', err)
  })
  // Graphics routes
  server.register({register: routes.graphics}, function(err) {
    if (err) server.log('error', err)
  })

  // ======================

  // Cookie definitions
  server.state('se_register', {
    encoding: 'iron',
    password: constants.cookiePass,
    path: '/',
    ignoreErrors: false,
    clearInvalid: true
  })

  // ======================

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

  // ======================

  // Start server
  server.start(function () {
    server.log('info', 'Server running at: ' + server.info.uri);
  });
}
