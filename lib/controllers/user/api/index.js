var _ = require('lodash')
var constants = require('lib/constants')
var async = require('async')
var mongoose = require('mongoose')
var User = mongoose.model('User');
var Email = require('lib/util/email');
var Boom = require('boom');
var validator = require('validator');

module.exports = {
  sendSuggestion: sendSuggestion
}

function sendSuggestion(request, reply) {
  var sid = request.state.sid;
  var payload = request.payload;
  payload.description = validator.escape(payload.description);

  var emailTemplate = require('lib/util/email/templates/suggestion');
  emailTemplate.locals = {
    email: 'admin@startessential.com',
    from_email: sid.email,
    fname: sid.first_name,
    description: payload.description
  }
  Email.send(emailTemplate, function() {
    return reply({status: 'success', data: null, message: 'Successfully submitted suggestion. We will personally reply to you as soon as possible. Thank you!'})
  })
}

