var async = require('async');
var _ = require('lodash');
var moment = require('moment');
var User = require('../lib/models/user.js');

exports.up = function(next) {
  User.find({}).exec(function(err, users) {
    if (err) return done(err)
    async.each(users, function(user, done) {

      var monthDate = user.records.month_renew_date;
      var weekDate = user.records.week_renew_date;

      monthDate = _.isNaN( new Number(monthDate) ) ? moment( monthDate ) : moment( new Number( monthDate ) );
      weekDate = _.isNaN( new Number(weekDate) ) ? moment( weekDate ) : moment( new Number( weekDate ) );

      user.records.month_renew_date = monthDate.unix();
      user.records.week_renew_date = weekDate.unix();

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

