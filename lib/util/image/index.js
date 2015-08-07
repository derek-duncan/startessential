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
  if (this.options.filename) {
    this.options.filename = options.filename.toString().replace('/\//g', '.') || '';
  } else {
    this.options.filename = '';
  }
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

Upload.prototype.createUserEmblem = function(options, callback) {
  var self = this;
  // Drawing with custom font only works with imageMagick
  var gm = require('gm').subClass({imageMagick: true});
  options.text = options.text || '';
  options.color = options.color || '#FF8F8F';
  options.size = options.size || 23;

  gm(path.join(__dirname, 'resources/emblem-boilerplate-alt.png'))
    .stream(function(err, stdout) {
      var fontPath = path.join(__dirname, 'resources/@HelveticaNeue.ttf');
      var name;
      if (options.name.length > 20) {
        var nameSplit = options.name.split(' ');
        name = nameSplit.shift();
      } else {
        name = options.name;
      }
      gm(stdout)
        .fill(options.color)
        .font(fontPath)
        .fontSize(options.size)
        .drawText(234, 78, options.number)
        .fill('#6D6D6D')
        .font(fontPath)
        .fontSize(28)
        .drawText(67, 26, name)
        .stream(function(err, stdout, stderr) {
          return self._send(stdout, self.options, callback)
        })
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

Upload.prototype.removeUpload = function(callback) {
  var self = this;
  var s3 = new AWS.S3();
  var params = {
    Bucket: 'startessentialuploads',
    Key: self.options.s3Key
  };

  s3.deleteObject(params, function(err) {
    return callback(err);
  });
}

Upload.prototype._send = function(stream, options, callback) {
  var self = this;

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
        console.log(progress)
      })

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
  options.s3Key = options.s3Key || '';
  options.emblemKey = options.emblemKey || '';
  var s3 = new AWS.S3();

  var emblemParams = {
    Bucket: 'startessentialuploads',
    Key: options.emblemKey
  };
  var imageParams = {
    Bucket: 'startessentialuploads',
    Key: options.s3Key
  };

  var emblemStream = s3.getObject(emblemParams).createReadStream();
  var tmpFile = '/tmp/emblems/' + options.emblemKey;

  fs.mkdir('/tmp/emblems', function(err) {
    gm(emblemStream)
      .write(tmpFile, function(err) {
        if (err) console.log(err)
        var imageStream = s3.getObject(imageParams).createReadStream();

        gm(imageStream)
          .composite(tmpFile)
          .geometry('+' + options.x + '+' + options.y)
          .stream(function(err, stdout, stderr) {
            return callback(err, stdout)
          })
      })
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

