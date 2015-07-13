var mongoose = require('mongoose')
var async = require('async')
var constants = require('_/constants');
var _ = require('lodash')
var Joi = require('joi')
var Boom = require('boom')
var User = mongoose.model('User');
var Post = mongoose.model('Post');
var AppCtrl = require('../controllers/app');

exports.register = function(server, options, next) {
  var defaultAuth = {
    strategy: 'bearer',
    scope: constants.SCOPE.PRE_AUTHENTICATED
  }

  server.route({
    method: 'GET',
    path: '/app',
    config: {
      auth: false
    },
    handler: function (request, reply) {
      reply.view('app/app');
    }
  })
  server.route({
    method: 'GET',
    path: '/app/{param*}',
    config: {
      auth: false
    },
    handler: function (request, reply) {
      var React = require('react/addons');
      var Router = require('react-router');
      var Location = Router.Location;
      var Routes = require('../../assets/js/src/routes.jsx');
      var location = new Location(request.path, request.query);

      Router.run(routes, location, function(error, initialState, transition) {
        // do your own data fetching, perhaps using the
        // branch of components in the initialState
        fetchSomeData(initialState.components, function(error, initialData) {
          var html = React.renderToString(React.createElement(Router));
          return reply(html);
        });
      });
      //reply.view('app/app');
    }
  })

  server.route({
    method: 'GET',
    path: '/api/v1/posts',
    config: {
      auth: {
        strategy: 'bearer',
        scope: ['authenticated']
      }
    },
    handler: AppCtrl.Post.findAll
  });

  server.route({
    method: 'GET',
    path: '/api/v1/posts/{post_id}',
    config: {
      auth: {
        strategy: 'bearer',
        scope: ['authenticated']
      }
    },
    handler: AppCtrl.Post.findOne
  });

  server.route({
    method: 'GET',
    path: '/api/v1/search',
    config: {
      auth: {
        strategy: 'bearer',
        scope: ['authenticated']
      },
      validate: {
        query: {
          q: Joi.string(),
          limit: Joi.number().optional(),
          offset: Joi.number().optional(),
        }
      }
    },
    handler: AppCtrl.Post.search
  });

  server.route({
    method: 'POST',
    path: '/api/v1/login',
    config: {
      auth: false
    },
    handler: AppCtrl.User.login
  });

  server.route({
    method: 'GET',
    path: '/api/v1/users/{user_id}',
    config: {
      auth: defaultAuth
    },
    handler: AppCtrl.User.getUser
  });

  server.route({
    method: 'GET',
    path: '/api/v1/saves',
    config: {
      auth: {
        strategy: 'bearer',
        scope: ['authenticated']
      }
    },
    handler: AppCtrl.Post.Saved.findAll
  });

  server.route({
    method: 'POST',
    path: '/api/v1/saves',
    config: {
      auth: {
        strategy: 'bearer',
        scope: ['authenticated']
      }
    },
    handler: AppCtrl.Post.Saved.create
  });

  server.route({
    method: 'GET',
    path: '/api/v1/saves/{saved_code}',
    config: {
      auth: {
        strategy: 'bearer',
        scope: ['authenticated']
      }
    },
    handler: AppCtrl.Post.Saved.findOne
  });
}

exports.register.attributes = {
  name: 'apiRoutes',
  version: '0.1'
}
