var Upload = require('s3-uploader');
var async = require('async');
var fs = require('fs');
var moment = require('moment');
var path = require('path');
var Boom = require('boom');

var awsConfig = {
  id: 'AKIAIATRZOG65BYVOFOQ',
  secretKey: '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'
};

exports.image = function(file, date, done) {
  async.waterfall([
    function(done) {
      var name = file.hapi.filename;
      var tmp_path = '/tmp/' + name);
      var stream = fs.createWriteStream(tmp_path);

      stream.on('error', function (err) {
        return done(Boom.wrap(err, 500))
      });
      file.pipe(stream);
      file.on('end', function (err) {
        fs.chmod(tmp_path, '755', function(err) {
          return done(null, tmp_path)
        });
      })

    }, function(tmp_path, done) {
      var server_path = 'posts/' + moment(date).format('MM-DD-YYYY');
      var client = new Upload('startessentialuploads', {
        aws: {
          region: 'us-west-2',
          path: server_path,
          acl: 'public-read',
          accessKeyId: awsConfig.id,
          secretAccessKey: awsConfig.secretKey
        },
        versions: [
          {
            original: true
          },
          {
            suffix: '-large',
            quality: 80,
            maxHeight: 1040,
            maxWidth: 1040,
          },
          {
            suffix: '-medium',
            maxHeight: 780,
            maxWidth: 780
          },
          {
            suffix: '-small',
            maxHeight: 320,
            maxWidth: 320
          }
        ]
      });

      client.upload(tmp_path, {}, function(err, images, meta) {
        if (err) {
          return done(Boom.wrap(err, 500));
        }
        fs.unlink(tmp_path, function(err) {
          return done(null, images[1].url);
        })
      });
    }
  ], function(err, image_url) {
    if (err) {
      return done(err)
    }
    return done(null, image_url);
  });
}
