'use strict'

var async = require('async');
var moment = require('moment');
var User = require('../lib/models/user.js');

exports.up = function(next) {
  User.find({}).lean().exec(function(err, users) {
    async.each(users, function(user, done) {
      var records = user.records;
      user.records.month_renew_date = records.month_renew_date;
      user.save(function() {
        return done()
      });
    }, function() {
      return next();
    });
  });
};

exports.down = function(next) {
  next();
};
