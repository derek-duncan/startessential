var _ = require('lodash');
var async = require('async');
var moment = require('moment');
var constants = require('lib/constants');
var path = require('path');
var Boom = require('boom');
var fs = require('fs');
var shortid = require('shortid');
var zlib = require('zlib');
var gm = require('gm');
var AWS = require('aws-sdk');
AWS.config.update({
  accessKeyId: constants.AWS.accessKeyId,
  secretAccessKey: constants.AWS.secretAccessKey,
  region: constants.AWS.region
});
//AWS.config.httpOptions = {timeout: 5000};

module.exports = Upload;

function Upload(options) {
  this.options = {};
  this.options.filename = options.filename.toString().replace('/\//g', '.') || '';
  this.options.shouldCopywrite = options.shouldCopywrite || true;
  this.ACL = 'public-read'
}

Upload.prototype.createImage = function(fileStream, callback) {
  var self = this;

  async.parallel({
    original: function(done) {
      var options = _.clone(self.options);
      options.filename = self._changeToJPG(options.filename);
      options.filename = self._appendToFilename(options.filename, 'orig')

      gm(fileStream)
        .resize(1500)
        .quality(95)
        .noProfile()
        .interlace('Plane')
        .setFormat('jpg')
        .stream(function(err, stdout) {
          self._send(stdout, options, done)
        })
    },
    small: function(done) {
      var options = _.clone(self.options);
      options.filename = self._changeToJPG(options.filename);
      options.filename = self._appendToFilename(options.filename, 'small')

      // Get the size of the image to properly align the copywrite
      var gmObject = gm(fileStream);
      if (self.options.shouldCopywrite) {
        self._addCopywrite(gmObject, function(err, newStream) {
          gmObject = gm(newStream);
        });
      }
      gmObject
        .resize(400)
        .quality(75)
        .noProfile()
        .interlace('Plane')
        .setFormat('jpg')
        .stream(function(err, stdout) {
          self._send(stdout, options, done)
        });
    },
    normal: function(done) {
      var options = _.clone(self.options);
      options.filename = self._changeToJPG(options.filename);
      options.filename = self._appendToFilename(options.filename, 'normal')

      // Get the size of the image to properly align the copywrite
      var gmObject = gm(fileStream);
      if (self.options.shouldCopywrite) {
        self._addCopywrite(gmObject, function(err, newStream) {
          gmObject = gm(newStream);
        });
      }
      gmObject
        .resize(1200)
        .quality(85)
        .noProfile()
        .interlace('Plane')
        .setFormat('jpg')
        .stream(function(err, stdout) {
          self._send(stdout, options, done)
        });
    }
  }, function(err, images) {
    return callback(err, images);
  })
}

Upload.prototype.customizeS3Image = function(options, callback) {
  var self = this;
  var s3 = new AWS.S3();
  var params = {
    Bucket: 'startessentialuploads',
    Key: options.s3Key
  };
  var readStream = s3.getObject(params).createReadStream();

  self.options.shouldCopywrite = false;
  self._addUserLink(readStream, options, function(err, stream) {
    if (err) console.log(err)
    self.createImage(stream, callback);
  })
}

Upload.prototype._send = function(stream, options, callback) {
  var self = this;

  console.log('uploading')
  console.log(options)
  async.waterfall([
    function(done) {
      // Create the streams
      var body = stream;
      var key = shortid.generate() + '-' + options.filename;
      var params = {
        Bucket: "startessentialuploads",
        Key: key,
        ACL: self.ACL,
        Body: body
      };
      var upload = new AWS.S3.ManagedUpload({queueSize: 1, params: params});
      upload.send(function(err, data) {
        if (err) return done(err);
        return done(null, {
          Key: key,
          Location: data.Location
        })
      })

      upload.on('httpUploadProgress', function(progress) {
        console.log(process.memoryUsage().rss/1000000+'Mb');
        console.log(progress)
      })

      //var s3Stream = require('s3-upload-stream')(new AWS.S3());
      //var key = shortid.generate() + '-' + options.filename;
      //var upload = s3Stream.upload({
      //  Bucket: "startessentialuploads",
      //  Key: key,
      //  ACL: self.ACL
      //});

      //upload.maxPartSize(10485760); // 10 MB
      //upload.concurrentParts(5);

      //upload.on('part', function(progress) {
      //  console.log(progress)
      //});

      //upload.on('uploaded', function(details) {
      //  return done(err, {
      //    Key: details.Key,
      //    Location: details.Location
      //  })
      //});

      //stream.pipe(upload);
    }
  ], function(err, uploadDetails) {
    if (err) {
      return callback(err)
    }
    return callback(null, uploadDetails);
  });
}

Upload.prototype._addUserLink = function(stream, options, callback) {
  options.x = options.x || 0;
  options.y = options.y || 0;
  options.text = options.text || '';
  options.color = options.color || '#DA4740';
  options.size = options.size || 25;

  gm(stream)
    .background('none')
    .fill(options.color)
    .font(path.join(__dirname, 'resources/Museo_Slab_500_2.otf'))
    .pointSize(options.size)
    .drawText(options.x, options.y, options.text)
    .stream(function(err, stdout, stderr) {
      return callback(err, stdout)
    })
}

Upload.prototype._addCopywrite = function(gmObject, done) {
  var watermark = path.join(__dirname, 'resources/se-watermark.png');

  gmObject.resize(1500)
  gmObject.composite(watermark)
  gmObject.gravity('Center')
  gmObject.stream(function(err, stdout) {
    return done(null, stdout);
  });
}

Upload.prototype._appendToFilename = function (filename, text) {
  return filename.replace(/(\.[^\.]+)$/, '_' + text + '$1');
}

Upload.prototype._changeToJPG = function(filename) {
  return filename.substr(0, filename.lastIndexOf(".")) + ".jpg";
}

