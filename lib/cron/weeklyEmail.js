var mongoose = require('mongoose');
var async = require('async');
var moment = require('moment');
var Post = mongoose.model('Post');
var User = mongoose.model('User');
var Email = require('lib/util/email');
var CronJob = require('cron').CronJob;
var job;

job = new CronJob({
  // seconds, minutes, hours, days of month, months, days of week
  cronTime: '00 30 06 * * 04',
  //cronTime: moment().add(2, 'minutes').toDate(),
  onTick: function() {
    async.waterfall([
      function(done) {
        var lastWeek = moment().subtract(7, 'days' ).toDate();
        Post.find({ date_published: { $gt: lastWeek } }).limit(3).exec(function(err, posts) {
          if (err) return done(err)
          return done(null, posts)
        })
      },
      function(posts, done) {
        if (!posts.length) return done();
        User.find({deleted: false}).select('email first_name').lean().exec(function(err, users) {
          async.each(users, function(user, done) {
            var emailTemplate = require('lib/util/email/templates/weekly-graphic-news');
            emailTemplate.locals = {
              email: user.email,
              fname: user.first_name,
              posts: posts
            }
            Email.send(emailTemplate, function() {
              return done()
            });
          }, done)
        })
      },
    ])
  },
  start: true,
  timeZone: 'America/Chicago'
});

module.exports = job;

