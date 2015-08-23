var AppCtrl = require('lib/controllers');

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
      return reply.view('core/index', {
        title: 'Exclusive Collection of Essential Oil Graphics for Young Living Distributors | Start Essential'
      }).state('friend', request.query.friend);
    }
  })
  server.route({
    method: 'GET',
    path: '/plans',
    config: {
      auth: false
    },
    handler: function (request, reply) {
      return reply.view('core/plans', {
        title: 'Graphic Plans | Start Essential'
      });
    }
  })
  server.route({
    method: 'GET',
    path: '/privacy-policy',
    config: {
      auth: false
    },
    handler: function (request, reply) {
      return reply.view('core/privacy_policy');
    }
  })
  server.route({
    method: 'GET',
    path: '/terms-of-service',
    config: {
      auth: false
    },
    handler: function (request, reply) {
      return reply.view('core/terms_of_service');
    }
  })
  server.route({
    method: 'GET',
    path: '/thankyou',
    handler: function (request, reply) {
      reply.view('core/thankyou', {
        title: 'Thank you for joining Start Essential!'
      });
    }
  })

  server.route({
    method: 'GET',
    path: '/sitemap.xml',
    handler: AppCtrl.Core.generateSitemap
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
      return reply.view('core/login', {
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

  return next()
}

exports.register.attributes = {
  name: 'mainRoutes',
  version: '0.1'
}
