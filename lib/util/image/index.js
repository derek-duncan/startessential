'use strict';
const constants = require('lib/constants');

module.exports = {
  Upload: require('./Upload.js'),
  Image: require('./Image.js')
};


function test(key) {
  const AWS = require('aws-sdk');

  AWS.config.update({
    accessKeyId: constants.AWS.accessKeyId,
    secretAccessKey: constants.AWS.secretAccessKey,
    region: constants.AWS.region
  });

  const Upload = require('./Upload.js');
  const Image = require('./Image.js');

  var s3 = new AWS.S3();
  var params = {
    Bucket: 'startessentialuploads',
    Key: key
  };
  var readStream = s3.getObject(params).createReadStream();

  const img = new Image(readStream);
  img.addUserEmblem({
    emblemKey: 'VJvCazo9-missy.png'
  }).then(stream => {

    console.log('emblem –> got stream');
    return img.addCopywrite();
  }).then(stream => {

    console.log('copywrite –> got stream');
    return img.createVersion({
      size: 1500,
      quality: 95,
      type: 'original'
    });
  }).then(version => {

    var upload = new Upload();
    return upload.send(version.stream, { filename: 'TEST.jpg'});
  }).then(details => {
    console.log('uploaded -> ', details);
  }).catch(err => {

    console.log(err);
  });
}

test('41GAJkNp5-_orig.jpg');
