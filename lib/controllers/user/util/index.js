'use strict';

// Drawing with custom font only works with imageMagick
const gm = require('gm').subClass({imageMagick: true});
const path = require('path');
const constants = require('lib/constants');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const S3Connector = require('lib/util/image').S3Connector;

AWS.config.update({
  accessKeyId: constants.AWS.accessKeyId,
  secretAccessKey: constants.AWS.secretAccessKey,
  region: constants.AWS.region
});

class Util {
  createEmblem(options) {
    const DEFAULTS = {
      name: '',
      memberNumber: '',
      color: '#FF8F8F',
      fontSize: 23
    };
    options = Object.assign({}, DEFAULTS, options);

    return new Promise((resolve, reject) => {

      generateImage().then(imageStream => {

        const S3Connection = new S3Connector();
        let uploadOptions = {
          filename: `${options.name.split(' ').shift().toLowerCase()}.png`
        };
        return S3Connection.send(imageStream, uploadOptions);
      }).then(uploadDetails => {

        return resolve(uploadDetails);
      }).catch(err => {

        return reject(err);
      });
    });

    function generateImage() {

      if (options.name.length > 20) {
        let nameSplit = options.name.split(' ');
        options.name = nameSplit.shift();
      }
      const emblemBoilerplateFile = path.join(constants.appRoot, 'lib/util/image/resources/emblem-boilerplate-alt.png');
      const fontFile = path.join(constants.appRoot, 'lib/util/image/resources/@HelveticaNeue.ttf');
      return new Promise((resolve, reject) => {

        gm(emblemBoilerplateFile)
          .fill(options.color)
          .font(fontFile)
          .fontSize(options.fontSize)
          .drawText(234, 78, String(options.memberNumber))
          .fill('#6D6D6D')
          .font(fontFile)
          .fontSize(28)
          .drawText(67, 26, String(options.name))
          .stream(function(err, stdout) {
            if (err) return reject(err);
            return resolve(stdout);
          });
      });
    }
  }
}

module.exports = Util;
