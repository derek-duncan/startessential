exports.register = function(server, options, next) {
  server.route({
    method: 'GET',
    path: '/',
    config: {
      auth: false
    },
    handler: function (request, reply) {
      if (request.auth.isAuthenticated) {
        return reply.redirect('/posts');
      }
      return reply.view('index', {
        title: 'An Exclusive Collection of Essential Oil Graphics for Young Living Distributors | Start Essential'
      }).state('friend', request.query.friend);
    }
  })
  server.route({
    method: 'GET',
    path: '/thankyou',
    config: {
      auth: {
        strategy: 'session',
        scope: ['authenticated']
      }
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
      auth: {
        strategy: 'session',
        mode: 'try'
      }
    },
    handler: function (request, reply) {
      if (request.auth.isAuthenticated && request.state.sid.scope !== 'pre_authenticated') {
        return reply.redirect('/posts')
      }
      return reply.view('login', {
        title: 'Login to Start Essential'
      });
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
