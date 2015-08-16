var mongoose = require('mongoose');
var async = require('async');
var moment = require('moment');
var User = mongoose.model('User');
var schedule = require('node-schedule');
var job;

//job = schedule.scheduleJob('0 1 0 * * *', function() {
job = schedule.scheduleJob(moment().add(10, 'seconds').toDate(), function() {
  User.find({}).select('scope records stripe').exec(function(err, users) {
    async.eachSeries(users, function(user, done) {
      user.setTrialStatus(function(err, result) {
        user.updateSubscriptionWeek(function(err, wasUpdated) {
          console.log('Updated user\'s weekly download date: ' + wasUpdated);
          return done()
        })
      });
    })
  })
});

module.exports = job;
