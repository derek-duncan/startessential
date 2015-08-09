"use strict";

var _ = require('lodash');
var Joi = require('joi');
var moment = require('moment');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var jwt = require('jsonwebtoken');
var secret = 'lasop7349wrsdlkfqo237148fsdfaojo3i740'
var Token = mongoose.model('Token')
var constants = require('lib/constants');
var stripe = require('stripe')(constants.STRIPE_KEY);
var shortid = require('shortid');

/**
 * User schema
 */

var UserSchema = new Schema({
  first_name: String,
  last_name: String,
  email: { type: String, required: true, lowercase:true, index: { unique: true } },
  referral_id: { type: String, default: shortid.generate },
  friend: { type: Schema.Types.ObjectId, ref: 'User'},
  friends: [{ type: Schema.Types.ObjectId, ref: 'User'}],
  member_number: { type: String },
  date_created: {type: Date, default: moment},
  date_active: {type: Date, default: moment},
  facebook_connected: {type: Boolean, default: false},
  facebook_id: String,
  logged_in: {type: Boolean, default: false},
  token: String,
  stripe: {
    date: Date,
    id: String,
    subscription: { type: String, default: constants.SUBSCRIPTIONS.TIER_1.NAME },
    subscription_id: String,
    trial_expired: { type: Boolean, default: false }
  },
  records: {
    month_renew_date: {type: String},
    week_renew_date: {type: String},
    downloads: {type: Number, default: constants.SUBSCRIPTIONS.TIER_1.LIMIT },
    downloaded: {type: Number, default: 0}
  },
  emblem: {
    Location: String,
    Key: String
  },
  saved_posts: [{type: Schema.Types.ObjectId, ref: 'Post'}],
  password_set: {type: Boolean, default: false},
  scope: {type: String, default: 'pre_authenticated'},
  deleted: {type: Boolean, default: false},
  api_token: {type: Object},
  isUpdated: {type: Boolean, default: false}
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

UserSchema.statics.encode = function(data) {
  return jwt.sign(data, secret);
};

UserSchema.statics.decode = function(token, done) {
  jwt.verify(token, secret, function(err, decoded) {
    if (err) return done(err)
    return done(null, decoded);
  });
};

UserSchema.methods.createUserToken = function() {
  var self = this;
  //Create a token and add to user and save
  var token = self.model('User').encode({uid: self._id, scope: self.scope});
  self.api_token = new Token({
    token: token
  });
};

UserSchema.methods.setChanged = function(state) {
  var self = this
  self.isUpdated = state;
}

UserSchema.methods.addFree30Days = function(done) {
  var Email = require('lib/util/email');
  var self = this;
  var new_end;
  stripe.customers.retrieveSubscription(self.stripe.id, self.stripe.subscription_id, function(err, subscription) {
    if (err) return done(err);
    var current_end_date = moment.unix(subscription.trial_end)
    var date_diff = moment().diff(current_end_date, 'days');

    if (date_diff < 0) { // if their trial is still active, set a new trial end from their signup date
      new_end = current_end_date.add(30, 'days').unix()
    } else { // if their trial has already expired, set a new trial end from their current date
      new_end = moment().add(30, 'days').unix();
    }
    stripe.customers.updateSubscription(self.stripe.id, self.stripe.subscription_id, { trial_end: new_end }, function(err, customer) {
      if (done) {
        if (err) return done(err)
        //Email.send(self.email, emails.NEW_REFERRAL())
        return done()
      }
    })
  })
}

UserSchema.methods.setTrialStatus = function(done) {
  var self = this;

  stripe.customers.retrieveSubscription(self.stripe.id, self.stripe.subscription_id, function(err, subscription) {
    if (err) {
      if (typeof(done) == 'function') return done(err);
    }
    if (!subscription) return done();

    var trialEnd = moment.unix(subscription.trial_end);
    var currentDate = moment();
    var trialExpired = currentDate.isAfter(trialEnd);

    if (trialExpired) {
      // Don't enable this because it redirects to login page before it can check trial status
      //self.logged_in = false;

      // If they are already authenticated, forget it
      if (self.scope !== constants.SCOPE.PRE_AUTHENTICATED) {
        self.stripe.trial_expired = false;
      } else {
        self.stripe.trial_expired = true;
      }
      self.save(function(err) {
        if (typeof(done) == 'function') return done(err, true);
      });
    }
    if (typeof(done) == 'function') return done(null, false);
  });
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
      var subscriptionDefaults = _.find(constants.SUBSCRIPTIONS, function(tier) {
        return tier.NAME === self.stripe.subscription
      });
      self.records.downloads = subscriptionDefaults.LIMIT || 2;
      self.records.downloaded = 0;
      self.setChanged(true)
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

UserSchema.methods.hasDownload = function() {
  return this.records.downloaded < this.records.downloads
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
  next()
})

var User = mongoose.model('User', UserSchema);

module.exports = User;

