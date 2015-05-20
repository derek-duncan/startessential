"use strict";

var _ = require('lodash');
var Joi = require('joi');
var moment = require('moment');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * User schema
 */

var UserSchema = new Schema({
  email: { type: String, required: true, lowercase:true, index: { unique: true } },
  referral_id: { type: String },
  friend: { type: Schema.Types.ObjectId, ref: 'User'},
  friends: [{ type: Schema.Types.ObjectId, ref: 'User'}],
  date_created: {type: Date, default: moment},
});

UserSchema.pre('save', function(next) {
  var self = this;
  if (self.isNew) {
    createReferral(function(id) {
      self.referral_id = id
      next()
    })
  } else {
    next()
  }
})

var User = mongoose.model('User', UserSchema);

function createReferral(done) {
  require('crypto').randomBytes(10, function(err, buf) {
    if (err) throw err;
    var referral = buf.toString('hex')
    return done(referral);
  });
}

module.exports = User;
