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
  first_name: String,
  last_name: String,
  email: { type: String, required: true, lowercase:true, index: { unique: true } },
  referral_id: { type: String },
  friend: { type: Schema.Types.ObjectId, ref: 'User'},
  friends: [{ type: Schema.Types.ObjectId, ref: 'User'}],
  member_number: { type: String },
  date_created: {type: Date, default: moment},
  facebook_connected: {type: Boolean, default: false},
  facebook_id: String,
  token: String,
  stripe: {
    id: String,
    subscription: { type: String, default: 'basic' },
  },
  password_set: {type: Boolean, default: false},
  scope: {type: String, default: 'pre_authenticated'},
  deleted: {type: Boolean, default: false}
});

UserSchema.virtual('full_name').get(function () {
  return this.first_name + ' ' + this.last_name;
});

UserSchema.virtual('distributor_link').get(function() {
  return 'http://startessential.com/n/' + this.member_number
})

UserSchema.pre('save', function(next) {
  var self = this;
  if (self.isNew) {
    self.updateMemberNumber(self.member_number)
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
