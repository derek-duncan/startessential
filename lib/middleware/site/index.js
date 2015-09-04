var _ = require('lodash');
var Boom = require('boom');
var mongoose = require('mongoose');
var Site = mongoose.model('Site');

exports.register = function (server, options, next) {

  server.ext('onPostAuth', function(request, reply) {

    var settings = _.merge(request.route.settings.plugins.site_user_check, options) || options;

    // If the route has the bypass setting, don't run the site validation on it.
    if (settings && settings.bypass) return reply.continue();

    // Find the site and check if the owner has a valid account
    var site_name = request.params.site_name;
    Site.findOne({ name: site_name }).populate('_user').exec(function( err, site ) {
      if ( err ) return reply( Boom.badGateway(null, err) );
      if (!site) return reply.redirect(settings.redirectTo);

      var user = site._user;
      if (user.stripe.trial_expired || user.deleted) return reply.redirect(settings.redirectTo);

      return reply.continue();
    });
  })

  return next();
};

exports.register.attributes = {
  name: 'site_user_check',
  version: '0.1'
};

