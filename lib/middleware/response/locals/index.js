var validator = require('validator');
var constants = require('lib/constants');
var path = require('path');
var fs = require('fs');

exports.register = function(server, options, next) {
  server.ext('onPreResponse', function(request, reply) {

    var response = request.response;
    if (response.variety === 'view' && response.source.context) {
      var context = response.source.context;

      // Attach the sid cookie to every view
      if (request.state.sid && context) {
        context.sid = request.state.sid;
      }

      // Add Helpers for Jade templates
      var helpersPath = path.resolve('lib/views/util/helpers');
      fs.readdirSync(helpersPath).forEach(function (file) {
        var isHelper = file.indexOf('.js') >= 0;

        if (isHelper && context) {
          var name = file.split('.')[0];
          context[name] = require(path.join(helpersPath, file));
        }

      });

      // Add Message to Jade templates
      var queryMessage = request.query.message;
      if (queryMessage) {
        context.message = validator.escape(queryMessage)
      }

      // Add FB App id to templates
      context.fb_app_id = constants.FB_APP_ID;
      context.stripe_key_pk = constants.STRIPE_KEY_PK;

    }

    return reply.continue();

  });

  return next();
}

exports.register.attributes = {
  name: 'locals',
  version: '0.1'
};
