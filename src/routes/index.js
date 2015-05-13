exports.register = function(server, options, next) {
  server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      reply.view('index', {
        title: 'Everything you need to grow your Essential Oil business'
      });
    }
  })
  server.route({
    method: 'GET',
    path: '/thankyou',
    handler: function (request, reply) {
      reply.view('thankyou', {
        title: 'Thank you for joining Start Essential!'
      });
    }
  })
  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: 'assets'
      }
    }
  })

  next()
}

exports.register.attributes = {
  name: 'mainRoutes',
  version: '0.1'
}
