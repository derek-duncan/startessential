var async = require('async');
var moment = require('moment');
var path = require('path');
var Boom = require('boom');
var fs = require('fs');
var AWS = require('aws-sdk');
AWS.config.update({
  accessKeyId: 'AKIAIATRZOG65BYVOFOQ',
  secretAccessKey: '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',
  region: 'us-west-2'
});


var uploader = {
  image: function(stream, filename, sub_folder, done) {

    var s3Stream = require('s3-upload-stream')(new AWS.S3());
    sub_folder = sub_folder.toString().replace('/', '.')

    async.waterfall([
      function(done) {
        // Create the streams
        var upload = s3Stream.upload({
          Bucket: "startessentialuploads",
          Key: sub_folder + '/' + filename,
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
          console.log(details)
          return done(null, details);
        });

        // Pipe the incoming filestream through compression, and up to S3.
        stream.pipe(upload);
      }
    ], function(err, image_url) {
      if (err) {
        return done(err)
      }
      return done(null, image_url);
    });
  },

  customize: function(key, user_id, done) {
    var s3 = new AWS.S3();
    var gm = require('gm');
    var params = {
      Bucket: 'startessentialuploads',
      Key: key
    };
    var readStream = s3.getObject(params).createReadStream();

    gm(readStream)
      .resize(240, 240)
      .stream(function (err, stdout, stderr) {
        uploader.image(stdout, key, user_id, function(err, details) {
          return done(null, details)
        })
      });
  }
}
module.exports = uploader;
