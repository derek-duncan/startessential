var mongoose = require('mongoose'),
    async = require('async'),
    moment = require('moment'),
    User = mongoose.model('User'),
    CronJob = require('cron').CronJob,
    job;

job = new CronJob({
  cronTime: '00 01 0 * * *',
  //cronTime: moment().add(10, 'seconds').toDate(),
  onTick: function() {
    User.find({}).select('records stripe').exec(function(err, users) {
      async.each(users, function(user, done) {
        user.updateSubscriptionWeek(function(err, wasUpdated) {
          console.log('Updated user\'s weekly download date: ' + wasUpdated);
        })
      })
    })
  },
  start: true,
  timeZone: 'America/Chicago'
});

module.exports = job;
