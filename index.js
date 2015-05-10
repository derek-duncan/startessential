var Hapi = require('hapi');
var Good = require('good');
var Path = require('path');

var server = new Hapi.Server();
server.connection({ port: 3000 });

server.views({
  engines: {
    jade: require('jade')
  },
  isCached: false,
  relativeTo: __dirname,
  path: 'views',
  helpersPath: 'views/helpers'
});

server.route({
  method: 'GET',
  path: '/',
  handler: function (request, reply) {
    reply.view('index', {
      title: 'Everything you need to grow your Essential Oil business'
    })
  }
});

server.route({
  method: 'GET',
  path: '/{name}',
  handler: function (request, reply) {
    reply('Hello, ' + encodeURIComponent(request.params.name) + '!');
  }
});

server.route({
  method: 'GET',
  path: '/{param*}',
  handler: {
    directory: {
      path: 'assets'
    }
  }
});

server.register({
  register: Good,
  options: {
    reporters: [{
      reporter: require('good-console'),
      events: {
        response: '*',
        log: '*'
      }
    }]
  }
}, function (err) {
  if (err) {
    throw err; // something bad happened loading the plugin
  }

  server.start(function () {
    server.log('info', 'Server running at: ' + server.info.uri);
  });
});
