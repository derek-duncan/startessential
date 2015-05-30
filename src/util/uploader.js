var async = require('async');
var moment = require('moment');
var path = require('path');
var Boom = require('boom');

var AWS      = require('aws-sdk'),
    fs       = require('fs'),
    s3Stream = require('s3-upload-stream')(new AWS.S3());

var awsConfig = {
  id: 'AKIAIATRZOG65BYVOFOQ',
  secretKey: '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',
  region: 'us-west-2'
};

AWS.config.update(awsConfig);

exports.image = function(file, date, done) {
  async.waterfall([
    function(done) {
      // Create the streams
      var upload = s3Stream.upload({
        Bucket: "startessentialuploads",
        Key: file.hapi.filename,
        ACL: 'public-read'
      });

      // Handle errors.
      upload.on('error', function (error) {
        if (error) {
          console.log(error)
          return done(error)
        }
      });

      // Handle progress.
      upload.on('part', function (details) {
      });

      // Handle upload completion.
      upload.on('uploaded', function (details) {
        return done(null, details.Location);
      });

      // Pipe the incoming filestream through compression, and up to S3.
      file.pipe(upload);
    }
  ], function(err, image_url) {
    if (err) {
      return done(err)
    }
    return done(null, image_url);
  });
}
