exports.register = function(server, options, next) {

  server.ext('onRequest', function(request, reply) {
    // create a redirect url
    if (request.url.path == '/login' && request.headers.referer) {
      var referer_url = request.headers.referer.split('/').slice(3);
      var redirect_url = '/' + referer_url.join('/');
      request.setUrl('/login?redirect=' + redirect_url);
    }

    return reply.continue();
  });

  return next();
}

exports.register.attributes = {
  name: 'redirect',
  version: '0.1'
};
