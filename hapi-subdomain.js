var Hoek = require('hoek');
var _ = require('lodash');

exports.register = function(server, options, next) {

  options.subdomainLevels = options.subdomainLevels || options.subdomain.split('.').length;

  server.ext('onRequest', function(request, reply) {

    var requestSubdomainSplit = request.info.hostname.split('.');
    var optionSubdomainSplit = options.subdomain.split('.');

    // Check subdomain against plugin options
    var requestMatchesSubdomain = false;
    for( var i = 0; i < options.subdomainLevels; i++) {
      var level = optionSubdomainSplit[i];
      var requestLevel = requestSubdomainSplit[ i ];

      if ( level === '*' || level === requestLevel ) {
        requestMatchesSubdomain = true;
        continue;
      }

      requestMatchesSubdomain = false;
      break;
    };

    // Check path against plugin options
    var requestPathSplit = request.url.path.split('/');
    var requestExcludesPath = false;
    for( var i = 0; i < requestPathSplit.length; i++) {
      var level = requestPathSplit[i];
      var included = _.includes( options.excludePath, level );
      if ( included ) {
        requestExcludesPath = false;
        break;
      }

      requestExcludesPath = true;
    };

    // Redirect the request to the correct route
    if (requestMatchesSubdomain && requestExcludesPath) {
      var subdomainString = requestSubdomainSplit.slice(0, options.subdomainLevels).join('/');
      var path = request.url.path === '/' ? '' : request.url.path;
      request.setUrl(options.destination + '/' + subdomainString + path);
    }

    return reply.continue();

  })

  next();
}

exports.register.attributes = {

  pkg: require('./package.json')

};

