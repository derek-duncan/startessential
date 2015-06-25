"use strict";

var _ = require('lodash');
var Joi = require('joi');
var moment = require('moment');
var stripe = require('stripe')('sk_test_8T9RioM6rUcrweVcJ0VluRyG');
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
    month_renew_date: {type: Date},
    week_renew_date: {type: Date},
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

UserSchema.methods.updateSubscriptionWeek = function(done) {
  var self,
      isNewPeriod, // A boolean that states whether their payment has renewed for a new month
      isNewWeek,
      updated,
      weekRenewDate, // The date when the week was renewed, with 1 week ADDED. Therfore, the renewal date
      currentDate, // A moment object of the date today
      currentPeriodEnd

  self = this;
  // Get the Stripe subscription object
  stripe.customers.retrieveSubscription(self.stripe.id, self.stripe.subscription_id, function(err, subscription) {
    if (err) return done(err)

    // Convert the current subscription cycle date to a moment format
    currentPeriodEnd = moment.unix(subscription.current_period_end)

    weekRenewDate = moment.unix(self.records.week_renew_date)
    currentDate = moment()

    isNewWeek = currentDate.isAfter(weekRenewDate)

    // If the current date is after the recorded "weekly renewal date," recalculate the dates for next renewal
    if (isNewWeek) {
      var isWithinNewDate,
          newWeekRenewDate

      newWeekRenewDate = weekRenewDate.add(1, 'week')
      isWithinNewDate = currentDate.isBefore(newWeekRenewDate)

      if (isWithinNewDate) {
        self.records.week_renew_date = newWeekRenewDate.unix()
      } else {
        // If the current date is WAYY past the last recorded "renewal date," calculate the new renewal date.

        // Get the numeric day of the week from the old week renewal date
        var dayOfOldRenewalDate = weekRenewDate.day()
        newWeekRenewDate = currentDate.day(dayOfOldRenewalDate)

        // Make sure the day moment selected is still not before the current date
        if (currentDate.isAfter(newWeekRenewDate)) {
          newWeekRenewDate = newWeekRenewDate.add(1, 'week')
        }
        self.records.week_renew_date = newWeekRenewDate.unix()
      }
      self.records.month_renew_date = currentPeriodEnd.unix()
      self.records.downloads = 2;
      self.records.downloaded = 0;
      updated = true;
      self.save(function() {
        return done(null, updated)
      })
    } else {
      updated = false
      return done(null, updated)
    }
  })
}

UserSchema.methods.setDownload = function(type, done) {
  var self, hasDownload;
  self = this;
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

function _week_of_month(date) {
  return Math.ceil(moment(date).date() / 7);
}

function createReferral(done) {
  require('crypto').randomBytes(10, function(err, buf) {
    if (err) throw err;
    var referral = buf.toString('hex')
    return done(referral);
  });
}

module.exports = User;

