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
  cronTime: '00 30 06 * * 0,4',
  //cronTime: moment().add(15, 'minutes').toDate(),
  onTick: function() {
    async.waterfall([
      function(done) {
        async.parallel({
          posts: function(done) {
            //var lastWeek = moment().subtract(7, 'days' ).toDate();
            //Post.find({ date_published: { $gt: lastWeek }, free: false }).limit(3).exec(function(err, posts) {
            Post.find({ 'published': true, 'free': false }).limit(3).sort({date_created: 'desc'}).exec(function(err, posts) {
              if (err) return done(err)
              return done(null, posts)
            })
          },
          bonus: function(done) {
            Post.findOne({ free: true }).sort({date_created: 'desc'}).exec(function(err, bonus) {
              if (err) return done(err)
              return done(null, bonus)
            })
          }
        }, done)
      },
      function(results, done) {
        if (!results.posts.length) return done( new Error( 'No posts could be found' ) );
        User.find({deleted: false}).select('email first_name').lean().exec(function(err, users) {
          async.eachSeries(users, function(user, done) {
            var emailTemplate = require('lib/util/email/templates/weekly-graphic-news');
            emailTemplate.locals = {
              email: user.email,
              fname: user.first_name,
              posts: results.posts,
              bonus: results.bonus
            }
            Email.send(emailTemplate, function(err) {
              return done(err)
            });
          }, done)
        })
      },
    ], function(err) {
      if (err) return console.log(err);
      return console.log( 'SUCCESSFULLY SENT WEEKLY EMAIL' )
    })
  },
  start: true,
  timeZone: 'America/Chicago'
});

module.exports = job;

