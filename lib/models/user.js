"use strict";

var _ = require('lodash');
var Joi = require('joi');
var moment = require('moment');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * User schema
 */

var RecordSchema = new Schema()

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
    date: Date,
    id: String,
    subscription: { type: String, default: 'basic' },
    subscription_id: String,
  },
  records: {
    current_week: {type: Date, default: moment},
    downloads: {type: Number, default: 2},
    downloaded: {type: Number, default: 0}
  },
  saved_posts: [{type: Schema.Types.ObjectId, ref: 'Post'}],
  password_set: {type: Boolean, default: false},
  scope: {type: String, default: 'pre_authenticated'},
  deleted: {type: Boolean, default: false}
});

UserSchema.virtual('records.current_week_number').get(function() {
  return Math.ceil(moment(this.records.current_week).date() / 7);
})

UserSchema.virtual('full_name').get(function () {
  return this.first_name + ' ' + this.last_name;
});

UserSchema.virtual('distributor_link').get(function() {
  return 'http://startessential.com/n/' + this.member_number
})

UserSchema.methods.addFreeMonth = function(done) {
  var Email = require('../util/email');
  var emails = require('../emails');
  var stripe = require('stripe')('sk_test_8T9RioM6rUcrweVcJ0VluRyG');
  var self = this;
  var new_end;
  stripe.customers.retrieveSubscription(self.stripe.id, self.stripe.subscription_id, function(err, subscription) {
    if (err) return done(err);
    var current_end_date = moment.unix(subscription.trial_end)
    var date_diff = moment().diff(current_end_date, 'months');

    if (date_diff < 0) { // if their trial is still active, set a new trial end from their signup date
      new_end = current_end_date.add(1, 'months').unix()
    } else { // if their trial has already expired, set a new trial end from their current date
      new_end = moment().add(1, 'months').unix();
    }
    stripe.customers.updateSubscription(self.stripe.id, self.stripe.subscription_id, { trial_end: new_end }, function(err, customer) {
      if (done) {
        if (err) return done(err)
        Email.send(self.email, emails.NEW_REFERRAL())
        return done()
      }
    })
  })
}

UserSchema.methods.setDownload = function(type, done) {
  var self = this;
  var isCurrentWeek = _week_of_month(self.records.current_week) === _week_of_month(moment())
  var hasDownload = false;
  if (!isCurrentWeek) {
    self.records.current_week = moment();
    self.records.downloads = 2;
    self.records.downloaded = 0;
  }
  if (self.records.downloaded < self.records.downloads) {
    if (type !== 'free') {
      self.records.downloaded += 1;
    }
    hasDownload = true;
  } else {
    hasDownload = false
  }

  self.save(function() {
    return done(hasDownload)
  })

  function _week_of_month(date) {
    return Math.ceil(moment(date).date() / 7);
  }
}

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

