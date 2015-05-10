"use strict";

var Hapi = require('hapi');
var constants = require('./src/config/constants.js');
var basicAuth = require('./src/middleware/basic-auth');
var routes = require('./src/routes/index.js');
var _ = require('underscore');
var fs = require('fs');

var server = new Hapi.Server()

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
  server.route(route);
});

module.exports = server;

if (process.env.NODE_ENV !== 'test') {
	server.start();

	console.log('Server running in port '+port);
}
