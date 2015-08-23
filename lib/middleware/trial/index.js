var Boom = require('boom');
var mongoose = require('mongoose');
var User = mongoose.model('User');

exports.register = function (server, options, next) {

  server.ext('onPostAuth', function(request, reply) {

    // If the user is not logged in, we don't care about them finishing their account
    if (!request.auth.isAuthenticated) return reply.continue();

    var settings = request.route.settings.plugins.trial_validate || options;

    // If the router has the bypass tag, don't run the trial check (like the /register/finalize). This is to prevent an infinite loop to login and back
    if (settings && settings.bypass) return reply.continue();

    // Again, if the user object is not available, we don't care. We put this after the bypass check so it will be considered
    var sid = request.state.sid;
    if (!sid) return reply.continue();

    // Find the user to check his trial status
    User.findOne({_id: sid._id}).lean().exec(function(err, user) {

      if (err) return reply(Boom.badGateway(null, err));

      if (user.stripe.trial_expired) {

        // Redirect to the payment page
        if (settings.redirectTo) {
          return reply('You are being redirected').redirect(settings.redirectTo);
        } else {
          return reply(Boom.forbidden('Your trial has expired. Please add payment information to continue access'));
        }

      } else {

        // If the trial is still active, continue as normal
        return reply.continue();

      }
    })

  })

  return next();
};

exports.register.attributes = {
  name: 'trial_validate',
  version: '0.1'
};
