exports.register = function(server, options, next) {

  server.ext('onPreResponse', function(request, reply) {

    var response = request.response;
    if (process.env.NODE_ENV === 'production') {
      if (response.isBoom && response.output.statusCode === 403) {
        return reply.view('403');
      }
      if (response.isBoom && response.output.statusCode === 404) {
        return reply.view('404');
      }
      if (response.isBoom && response.output.statusCode === 500) {
        return reply.view('500');
      }
    }

    return reply.continue();

  });

}

exports.register.attributes = {
  name: 'errorPages',
  version: '0.1'
};

