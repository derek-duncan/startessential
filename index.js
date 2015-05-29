"use strict";

var Hapi = require('hapi');
var Good = require('good');
var constants = require('./src/config/constants.js');
var routes = require('./src/routes/index.js');
var _ = require('underscore');
var fs = require('fs');

var server = new Hapi.Server()
var mongoose = require('mongoose')

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
  path: 'views',
  helpersPath: 'views/helpers'
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

// Cookie strategyserver.register(require('hapi-auth-cookie'), function (err) {

server.register(require('hapi-auth-cookie'), function (err) {
  server.auth.strategy('session', 'cookie', {
    password: 'secret',
    cookie: 'sid',
    redirectTo: '/',
    isSecure: false
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
