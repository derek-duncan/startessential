var async = require('async');
var _ = require('lodash');
var Upload = require('../lib/util/image')
var User = require('../lib/models/user.js');

exports.up = function(next) {
  User.find({ }).exec(function(err, users) {
    if (err) return done(err)
    async.each(users, function(user, done) {
      if (user.scope === 'admin') return done();

      var newUpload = new Upload({
        filename: user.first_name.toLowerCase() + '.png'
      });
      var emblemOptions = {
        number: user.member_number,
        name: user.full_name
      };
      newUpload.createUserEmblem(emblemOptions, function(err, emblemOptions) {
        user.emblem = emblemOptions;
        user.save(function() {
          return done();
        });
      })
    }, function(err) {
      console.log( 'MIGRATION COMPLETE' );
      return next(err);
    });
  });
};

exports.down = function(next) {
  next();
};
