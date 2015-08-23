var _ = require('lodash');

exports.register = function(server, options, next) {
  server.ext('onPreResponse', function(request, reply) {

    var response = request.response;
    if (response.variety === 'view' && response.source.context) {
      var context = response.source.context;

      // Trigger request logging
      var exclude = ['css', 'images', 'js', 'fonts']
      var pathDirectory = request.path.split('/')[1]
      if (!_.includes(exclude, pathDirectory)) {
        var sid = request.state.sid || {}
        request.log(['request', 'uid'], sid._id)
      }

    }

    return reply.continue();

  });

  return next();
}

exports.register.attributes = {
  name: 'logging',
  version: '0.1'
};
