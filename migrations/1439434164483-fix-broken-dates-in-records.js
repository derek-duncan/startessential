var async = require('async');
var _ = require('lodash');
var moment = require('moment');
var User = require('../lib/models/user.js');

exports.up = function(next) {
  User.find({}).exec(function(err, users) {
    if (err) return done(err)
    async.each(users, function(user, done) {

      user.records.month_renew_date = moment().add(1, 'month').unix();
      user.records.week_renew_date = moment().add(1, 'week').unix();

      user.save(function() {
        return done()
      });
    }, function(err) {
      console.log( 'MIGRATION COMPLETE' );
      return next(err);
    });
  });
};

exports.down = function(next) {
  next();
};

