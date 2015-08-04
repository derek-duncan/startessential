var Boom = require('boom');
var mongoose = require('mongoose');
var User = mongoose.model('User');

exports.register = function (server, options, next) {
  server.ext('onPostAuth', function(request, reply) {

    if (!request.auth.isAuthenticated) return reply.continue();

    var settings = request.route.settings.plugins.trial_validate || options;
    if (settings && settings.bypass) return reply.continue();

    var sid = request.state.sid;
    if (!sid) return reply.continue();

    User.findOne({_id: sid._id}).lean().exec(function(err, user) {

      if (err) return reply(Boom.badGateway(null, err));

      if (user.stripe.trial_expired) {

        if (settings.redirectTo) {
          return reply('You are being redirected', null, { credentials: user }).redirect(settings.redirectTo);
        } else {
          return reply(Boom.forbidden('Your trial has expired. Please add payment information to continue access'), null, { credentials: user });
        }

      } else {

        return reply.continue({ credentials: user });

      }
    })

  })

  return next();
};

exports.register.attributes = {
  name: 'trial_validate'
};
