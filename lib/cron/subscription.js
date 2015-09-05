var mongoose = require('mongoose');
var async = require('async');
var moment = require('moment');
var User = mongoose.model('User');
var Email = require('lib/util/email');
var schedule = require('node-schedule');
var job;

job = schedule.scheduleJob('0 1 0 * * *', function() {
//job = schedule.scheduleJob(moment().add(10, 'seconds').toDate(), function() {
  User.find({}).select('logged_in deleted scope records stripe email first_name').exec(function(err, users) {
    async.eachSeries(users, function(user, done) {
      if (user.deleted) return done();
      user.setTrialStatus(function(err, trialExpired) {
        if (!trialExpired) {

          user.updateSubscriptionWeek(function(err, wasUpdated) {
            if (wasUpdated) {
              var emailTemplate = require('lib/util/email/templates/new-subscription-week');
              emailTemplate.locals = {
                email: user.email,
                fname: user.first_name
              }
              Email.send(emailTemplate);
            }
            console.log('Updated user\'s weekly download date: ' + wasUpdated);
            return done()
          });
        }
      });
    })
  })
});

module.exports = job;
