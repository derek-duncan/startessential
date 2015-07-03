var _ = require('lodash')
var constants = require('_/constants')
var async = require('async')
var mongoose = require('mongoose')
var User = mongoose.model('User');
var Post = mongoose.model('Post');
var Boom = require('boom');
var responseHandler = require('_/util/responseHandler')

module.exports = {
  login: login
}

function login(request, reply) {
  var payload = request.payload;
  User.findOne({ facebook_id: payload.fbID }, function(err, user) {
    if (err) return reply(responseHandler(false, null))
    return reply(responseHandler(true, { user: user }, 'Successfully logged in')).code(200)
  })
}
