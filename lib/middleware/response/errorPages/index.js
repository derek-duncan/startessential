exports.register = function(server, options, next) {

  server.ext('onPreResponse', function(request, reply) {
    var response = request.response;
    if (process.env.NODE_ENV === 'production') {
      if (response.isBoom && response.output.statusCode === 403) {
        return reply.view('core/403');
      }
      if (response.isBoom && response.output.statusCode === 404) {
        return reply.view('core/404');
      }
      if (response.isBoom && response.output.statusCode === 500) {
        console.log(response);
        return reply.view('core/500');
      }
    }

    return reply.continue();

  });

  return next();
}

exports.register.attributes = {
  name: 'errorPages',
  version: '0.1'
};

