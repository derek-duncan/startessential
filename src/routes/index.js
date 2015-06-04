exports.register = function(server, options, next) {
  server.route({
    method: 'GET',
    path: '/',
    config: {
      auth: false
    },
    handler: function (request, reply) {
      //var switchReq = _getRandomInt(0, 1);
      //if (switchReq) {
      //  return reply.redirect('/v2')
      //}
      if (request.auth.isAuthenticated) {
        return reply.redirect('/posts');
      }
      return reply.view('index', {
        title: 'Everything you need to grow your Essential Oil business',
        header: 'Everything you need to grow your Essential Oil business',
        version: 1
      }).state('friend', request.query.friend);
    }
  })
  server.route({
    method: 'GET',
    path: '/v2',
    config: {
      auth: false
    },
    handler: function (request, reply) {
      reply.view('index', {
        title: 'Everything you need to grow your Essential Oil business',
        header: 'A huge collection of essential oil infographics and social media posts',
        version: 2
      });
    }
  })
  server.route({
    method: 'GET',
    path: '/thankyou',
    config: {
      auth: false
    },
    handler: function (request, reply) {
      reply.view('thankyou', {
        title: 'Thank you for joining Start Essential!'
      });
    }
  })
  server.route({
    method: 'GET',
    path: '/login',
    config: {
      auth: false
    },
    handler: function (request, reply) {
      reply.view('login', {
        title: 'Login to Start Essential'
      });
    }
  })
  server.route({
    method: 'GET',
    path: '/register',
    config: {
      auth: false
    },
    handler: function (request, reply) {
      reply.view('register', {
        title: 'Register for Start Essential'
      }).state('se_member_number', request.query.se_member_number);
    }
  })
  server.route({
    method: 'GET',
    path: '/{param*}',
    config: {
      auth: false
    },
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
