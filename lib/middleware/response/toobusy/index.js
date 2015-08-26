var toobusy = require('toobusy-js');

exports.register = function(server, options, next) {
  server.ext('onPreResponse', function(request, reply) {

    var response = request.response;
    if (response.variety === 'view' && response.source.context) {
      var context = response.source.context;

      // Check to make sure we aren't too busy
      toobusy.maxLag(3000);
      if (toobusy()) {
        return reply.view('core/503');
      }
    }
    return reply.continue();

  });

  return next();
}

exports.register.attributes = {
  name: 'toobusy',
  version: '0.1'
};
