"use strict";

var Hapi = require('hapi');
var Good = require('good');
var Poop = require('poop');
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

//server.register(require('hapi-auth-basic'), function (err) {
//  server.auth.strategy('simple', 'basic', true, {
//    validateFunc: basicAuth
//  });
//});

// Add all the routes within the routes folder
fs.readdirSync('./src/routes').forEach(function(file) {
  var route = require('./src/routes/' + file);
  server.route(route(server));
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
