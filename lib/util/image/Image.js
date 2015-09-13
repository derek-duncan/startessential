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

  constructor(fileStreamOrKey, options) {

    const DEFAULTS = {
      filename: ''
    };
    Object.assign(this, DEFAULTS, options);

    this._fileStreams = [];
    this.versions = new Map();

    if (fileStreamOrKey.readable) {
      this._fileStreams.push(fileStreamOrKey);
    }
    if (typeof fileStreamOrKey === 'string') {
      const params = {
        Bucket: 'startessentialuploads',
        Key: fileStreamOrKey
      };
      let readStream = s3.getObject(params).createReadStream();
      this._fileStreams.push(readStream);
    }
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
      size: 1500,
      quality: 95,
      name: 'original',
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
            stream: stdout,
            name: options.name,
            filename: `${options.name}.${options.format}`
          };
          self.versions.set(options.name, version);
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
