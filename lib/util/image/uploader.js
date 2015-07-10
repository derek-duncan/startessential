var async = require('async');
var moment = require('moment');
var constants = require('lib/constants');
var path = require('path');
var Boom = require('boom');
var fs = require('fs');
var gm = require('gm').subClass({imageMagick: true});
var AWS = require('aws-sdk');
AWS.config.update({
  accessKeyId: constants.AWS.accessKeyId,
  secretAccessKey: constants.AWS.secretAccessKey,
  region: constants.AWS.region
});


var uploader = {
  image: function(stream, options, done) {

    options.filename = options.filename || '';
    options.sub_folder = options.sub_folder.toString().replace('/\//g', '.') || '';

    var s3Stream = require('s3-upload-stream')(new AWS.S3());

    async.waterfall([
      function(done) {
        // Create the streams
        var upload = s3Stream.upload({
          Bucket: "startessentialuploads",
          Key: options.sub_folder + '/' + options.filename,
          ACL: 'public-read'
        });

        // Handle errors.
        upload.on('error', function (error) {
          if (error) {
            return done(Boom.badImplementation('', error))
          }
        });

        // Handle progress.
        upload.on('part', function (details) {
        });

        // Handle upload completion.
        upload.on('uploaded', function (details) {
          return done(null, details);
        });

        // Pipe the incoming filestream through compression, and up to S3.
        stream.pipe(upload);
      }
    ], function(err, details) {
      if (err) {
        return done(err)
      }
      return done(null, details);
    });
  },

  initial: function(stream, options, callback) {
    var watermark = path.join(__dirname, 'resources/se-watermark.png');
    var watermark_ratio = 1.665;
    async.parallel({
      original: function(done) {
        var opt = JSON.parse(JSON.stringify(options));
        opt.filename = appendToFilename(opt.filename, 'orig')
        gm(stream)
          .stream(function(err, stdout) {
            uploader.image(stdout, opt, done)
          })
      },
      small: function(done) {
        var opt = JSON.parse(JSON.stringify(options));
        opt.filename = appendToFilename(opt.filename, 'small')
        gm(stream).size({bufferStream: true}, function(err, size) {
          var paddedWidth = size.width / 1.3;
          var paddedHeight= paddedWidth / watermark_ratio;
          this.composite(watermark)
          this.geometry(paddedWidth+'x'+paddedHeight+'+0+0')
          this.gravity('Center')
          this.stream(function(err, stdout, stderr) {
            gm(stdout).resize(400).quality(75).stream(function(err, stdout) {
              uploader.image(stdout, opt, done)
            })
          })
        })
      },
      normal: function(done) {
        var opt = JSON.parse(JSON.stringify(options));
        opt.filename = appendToFilename(opt.filename, 'normal')
        gm(stream).size({bufferStream: true}, function(err, size) {
          var paddedWidth = size.width / 1.3;
          var paddedHeight= paddedWidth / watermark_ratio;
          this.composite(watermark)
          this.geometry(paddedWidth+'x'+paddedHeight+'+0+0')
          this.gravity('Center')
          this.stream(function(err, stdout, stderr) {
            gm(stdout).resize('1200x>').quality(85).stream(function(err, stdout) {
              uploader.image(stdout, opt, done)
            })
          })
        })
      }
    }, function(err, images) {
      return callback(err, images);
    })
  },

  customize: function(key, user_id, options, done) {
    var s3 = new AWS.S3();
    var customizer = require('lib/util/customize_image');
    var params = {
      Bucket: 'startessentialuploads',
      Key: key
    };
    var readStream = s3.getObject(params).createReadStream();

    gm(readStream)
      .stream(function (err, stdout, stderr) {
        customizer.link(stdout, options, function(err, stream) {
          if (err) console.log(err)
          async.parallel({
            original: function(done) {
              var uploaderOptions = {
                sub_folder: user_id,
                filename: appendToFilename(key, 'orig')
              }
              uploader.image(stream, uploaderOptions, function(err, details) {
                return done(err, details)
              })
            },
            normal: function(done) {
              var opt = {
                sub_folder: user_id,
                filename: appendToFilename(key, 'normal')
              }
              gm(stream)
                .resize('1200x>')
                .quality(85)
                .stream(function(err, stdout, stderr) {
                  uploader.image(stdout, opt, function(err, details) {
                    return done(err, details)
                  })
                })
            },
            small: function(done) {
              var opt = {
                sub_folder: user_id,
                filename: appendToFilename(key, 'small')
              }
              gm(stream)
                .resize(400)
                .quality(75)
                .stream(function(err, stdout, stderr) {
                  uploader.image(stdout, opt, function(err, details) {
                    return done(err, details)
                  })
                })
            }
          }, function(err, images) {
            return done(err, images)
          })
        })
      });
  }
}

function appendToFilename(filename, text) {
  return filename.replace(/(\.[^\.]+)$/, '_' + text + '$1');
}

module.exports = uploader;