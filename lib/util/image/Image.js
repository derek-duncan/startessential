'use strict';

const _ = require('lodash');
const async = require('async');
const moment = require('moment');
const constants = require('lib/constants');
const path = require('path');
const Boom = require('boom');
const fs = require('fs');
const shortid = require('shortid');
const gm = require('gm');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

AWS.config.update({
  accessKeyId: constants.AWS.accessKeyId,
  secretAccessKey: constants.AWS.secretAccessKey,
  region: constants.AWS.region
});

class Image {

  constructor(fileStream, options) {

    const DEFAULTS = {
      filename: ''
    };
    Object.assign(this, DEFAULTS, options);
    this._fileStreams = [fileStream];
    this.versions = new Map();
  }

  get fileStream() {
    const last = this._fileStreams.length - 1;
    return this._fileStreams[last];
  }

  set fileStream(newStream) {
    this._fileStreams.push(newStream);
  }

  createVersion(options) {

    const self = this;
    const DEFAULTS = {
      format: 'jpg'
    };
    options = Object.assign({}, DEFAULTS, options);

    return new Promise((resolve, reject) => {

      gm(self.fileStream)
        .resize(options.size)
        .quality(options.quality)
        .noProfile()
        .interlace('Plane')
        .setFormat(options.format)
        .stream((err, stdout) => {
          if (err) return reject(err);

          const version = {
            stream: stdout
          }
          self.versions.set(options.type, version);
          return resolve(version);
        });
    });
  }

  updateVersion(key, value) {
    self.versions.set(key, value);
  }

  addUserEmblem(options) {

    const self = this;
    const DEFAULTS = {
      x: 0,
      y: 0,
      emblemKey: ''
    };
    options = Object.assign({}, DEFAULTS, options);

    const emblemParams = {
      Bucket: 'startessentialuploads',
      Key: options.emblemKey
    };

    const emblemStream = s3.getObject(emblemParams).createReadStream();
    const tmpFile = '/tmp/emblems/' + options.emblemKey;

    return new Promise((resolve, reject) => {

      fs.mkdir('/tmp/emblems', (err) => {
        gm(emblemStream)
          .write(tmpFile, (err) => {
            // FIXME: Some reason there is a fatal error here
            //if (err) return reject(err)

            gm(self.fileStream)
              .composite(tmpFile)
              .geometry(`+${options.x}+${options.y}`)
              .stream((err, stdout) => {
                if (err) return reject(err);

                self.fileStream = stdout;
                return resolve(stdout);
              });
          });
      });
    });
  }

  addCopywrite() {

    const self = this;
    const watermark = path.join(__dirname, 'resources/se-watermark.png');

    return new Promise((resolve, reject) => {

      gm(self.fileStream)
        .resize(1500)
        .composite(watermark)
        .gravity('Center')
        .stream((err, stdout) => {
          if (err) return reject(err);

          self.fileStream = stdout;
          return resolve(stdout);
        });
    });
  }
}

module.exports = Image;

    //async.parallel({
      //small: function(done) {
      //  const filename = appendToFilename(changeToJPG(options.filename), 'small');

      //  // Get the size of the image to properly align the copywrite
      //  var gmObject = gm(fileStream);
      //  if (self.options.shouldCopywrite) {
      //    self._addCopywrite(gmObject, function(err, newStream) {
      //      gmObject = gm(newStream);
      //    });
      //  }
      //  gmObject
      //    .resize(400)
      //    .quality(75)
      //    .noProfile()
      //    .interlace('Plane')
      //    .setFormat('jpg')
      //    .stream(function(err, stdout) {
      //      self.versions.push({
      //        original: {
      //          stream: stdout,
      //          filename: filename
      //        }
      //      });
      //      return done();
      //    });
      //},
      //normal: function(done) {
      //  var options = _.clone(self.options);
      //  options.filename = self._changeToJPG(options.filename);
      //  options.filename = self._appendToFilename(options.filename, 'normal')

      //  // Get the size of the image to properly align the copywrite
      //  var gmObject = gm(fileStream);
      //  if (self.options.shouldCopywrite) {
      //    self._addCopywrite(gmObject, function(err, newStream) {
      //      gmObject = gm(newStream);
      //    });
      //  }
      //  gmObject
      //    .resize(1200)
      //    .quality(85)
      //    .noProfile()
      //    .interlace('Plane')
      //    .setFormat('jpg')
      //    .stream(function(err, stdout) {
      //      self._send(stdout, options, done)
      //    });
      //}
    //}, function(err) {
    //  return callback(err);
    //})
//}

//Upload.prototype.createUserEmblem = function(options, callback) {
//  var self = this;
//  self.options.shouldCopywrite = false;
//  // Drawing with custom font only works with imageMagick
//  var gm = require('gm').subClass({imageMagick: true});
//  options.text = options.text || '';
//  options.color = options.color || '#FF8F8F';
//  options.size = options.size || 23;

//  gm(path.join(__dirname, 'resources/emblem-boilerplate-alt.png'))
//    .stream(function(err, stdout) {
//      var fontPath = path.join(__dirname, 'resources/@HelveticaNeue.ttf');
//      var name;
//      if (options.name.length > 20) {
//        var nameSplit = options.name.split(' ');
//        name = nameSplit.shift();
//      } else {
//        name = options.name;
//      }
//      gm(stdout)
//        .fill(options.color)
//        .font(fontPath)
//        .fontSize(options.size)
//        .drawText(234, 78, options.number)
//        .fill('#6D6D6D')
//        .font(fontPath)
//        .fontSize(28)
//        .drawText(67, 26, name)
//        .stream(function(err, stdout, stderr) {
//          return self._send(stdout, self.options, callback)
//        })
//    })
//}

// TODO: This should be moved out of these functions so the stream can be passed

//Upload.prototype.customizeS3Image = function(options, callback) {
//  var self = this;
//  var s3 = new AWS.S3();
//  var params = {
//    Bucket: 'startessentialuploads',
//    Key: options.s3Key
//  };
//  var readStream = s3.getObject(params).createReadStream();

//  self.options.shouldCopywrite = false;
//  self._addUserLink(readStream, options, function(err, stream) {
//    if (err) console.log(err)
//    self.createImage(stream, callback);
//  })
//}
