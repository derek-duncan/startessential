"use strict";

var Hapi = require('hapi');
var Good = require('good');
var constants = require('./src/config/constants.js');
var routes = require('./src/routes/index.js');
var _ = require('underscore');
var fs = require('fs');

var server = new Hapi.Server()
var mongoose = require('mongoose')

var childProcess = require("child_process");
var oldSpawn = childProcess.spawn;
function mySpawn() {
    console.log('spawn called');
    console.log(arguments);
    var result = oldSpawn.apply(this, arguments);
    return result;
}
childProcess.spawn = mySpawn;

// Connect to mongodb
var connect = function () {
  var options = { server: { socketOptions: { keepAlive: 1 } } };
  mongoose.connect(constants.database['database'], options);
};
connect();

mongoose.connection.on('error', console.log);
mongoose.connection.on('disconnected', connect);

// Bootstrap models
fs.readdirSync(__dirname + '/src/models').forEach(function (file) {
  if (file.indexOf('.js') >= 0) require(__dirname + '/src/models/' + file);
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

server.ext('onPreResponse', function(request, reply) {
  var response = request.response;
  if (response.variety === 'view') {
    var context = response.source.context;
    fs.readdirSync(__dirname + '/views/helpers').forEach(function (file) {
      if (file.indexOf('.js') >= 0 && context) {
        var name = file.split('.')[0];
        context[name] = require(__dirname + '/views/helpers/' + file);
      }
    });
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

      // Use a real strategy here,
      // comparing with a token from your database for example
      if(token === "39109*089a8a--_asjlu716CVae3ER"){
        callback(null, true, {
          scope: 'admin',
          token: token
        })
      } else {
        callback(null, false)
      }
    }
  });
});

// Cookie strategy

server.register(require('hapi-auth-cookie'), function (err) {
  server.auth.strategy('session', 'cookie', {
    password: 'secret',
    cookie: 'sid',
    redirectTo: '/',
    isSecure: false,
    validateFunc: function(session, callback) {
      var User = mongoose.model('User');
      User.findOne({_id: session._id}, function(err, user) {
        if (err) callback(err)
        if (!user) callback(null, false)
        if (user.scope === 'admin') {
          callback(null, true, {
            scope: 'admin'
          })
        } else {
          callback(null, true, {
            scope: 'user'
          })
        }
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
    isSecure: false     // Terrible idea but required if not using HTTPS
  });
});


// Add all the routes within the routes folder
// API routes
server.register({register: require('./src/routes/api')}, function(err) {
  if (err) server.log('error', err)
})
// Index routes
server.register({register: require('./src/routes/index')}, function(err) {
  if (err) server.log('error', err)
})
// App routes
server.register({register: require('./src/routes/app')}, function(err) {
  if (err) server.log('error', err)
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
