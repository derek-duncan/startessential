'use strict';

const async = require('async');
const constants = require('lib/constants');
const shortid = require('shortid');
const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: constants.AWS.accessKeyId,
  secretAccessKey: constants.AWS.secretAccessKey,
  region: constants.AWS.region
});

class S3Connector {

  constructor(options) {

    const DEFAULTS = {
      ACL: 'public-read'
    };
    Object.assign(this, DEFAULTS, options);
  }

  send(stream, options) {

    const self = this;

    const DEFAULTS = {
      filename: '',
      name: ''
    };
    options = Object.assign({}, DEFAULTS, options);
    options.filename = String(options.filename).replace('/\//g', '.');

    return new Promise((resolve, reject) => {
      // Create the streams
      const key = `${shortid.generate()}-${options.filename}`;
      let params = {
        Bucket: "startessentialuploads",
        Key: key,
        ACL: self.ACL,
        Body: stream
      };
      const upload = new AWS.S3.ManagedUpload({
        queueSize: 1,
        params: params
      });

      upload.send((err, data) => {
        if (err) return reject(err);
        return resolve({
          Key: key,
          Location: data.Location,
          name: options.name
        });
      });

      upload.on('httpUploadProgress', progress => {
        let percent = parseInt(progress.loaded / progress.total * 100, 10);
        console.log(`${percent}%`);
      });

    });
  }

  remove(s3Key) {

    var params = {
      Bucket: 'startessentialuploads',
      Key: s3Key
    };

    return new Promise((resolve, reject) => {

      s3.deleteObject(params, function(err) {
        if (err) return reject(err);
        return resolve();
      });
    })
  }
};

module.exports = S3Connector;
