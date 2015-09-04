var Boom = require('boom');
var mongoose = require('mongoose');
var User = mongoose.model('User');

exports.register = function (server, options, next) {

  server.ext('onPostAuth', function(request, reply) {

    // If the user is not logged in, we don't care about them finishing their account
    if (! request.auth.isAuthenticated || ! request.state.sid ) return reply.continue();

    var uid = request.state.sid._id;
    if (!uid) return reply.continue();

    // Find the user and update the cookie
    User.findOne({_id: uid}).lean().exec(function(err, user) {

      if (err) return reply(Boom.badGateway(null, err));

      request.auth.session.set(user)
      return reply.continue();
    });

  })

  return next();
};

exports.register.attributes = {
  name: 'user_update',
  version: '0.1'
};

