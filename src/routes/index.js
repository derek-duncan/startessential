exports.register = function(server, options, next) {
  server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      var switchReq = _getRandomInt(0, 1);
      var header, v;
      if (switchReq) {
        header = 'Everything you need to grow your Essential Oil business'
        v = 1;
      } else {
        header = 'A huge collection of essential oil infographics and social media posts'
        v = 2;
      }

      reply.view('index', {
        title: 'Everything you need to grow your Essential Oil business',
        header: header,
        version: v
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

function _getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
