"use strict";

var Hapi = require('hapi');
var Good = require('good');
var constants = require('./src/config/constants.js');
var basicAuth = require('./src/middleware/basic-auth');
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

var port = constants.application['port'];
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

server.register(require('hapi-auth-bearer-token'), function (err) {

  server.auth.strategy('simple', 'bearer-access-token', {
    allowQueryToken: true,              // optional, true by default
    allowMultipleHeaders: false,        // optional, false by default
    accessTokenName: 'access_token',    // optional, 'access_token' by default
    validateFunc: function( token, callback ) {

      // For convenience, the request object can be accessed
      // from `this` within validateFunc.
      var request = this;

      // Use a real strategy here,
      // comparing with a token from your database for example
      if(token === "1234"){
        callback(null, true, { token: token })
      } else {
        callback(null, false, { token: token })
      }
    }
  });
});


// Add all the routes within the routes folder
fs.readdirSync('./src/routes').forEach(function(file) {
  var route = require('./src/routes/' + file);
  server.register({register: route}, function(err) {
    if (err) {
      server.log('error', err);
    }
  });
});

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
