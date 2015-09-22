var fs = require('fs')
var schedule = require('node-schedule');
var job;

job = schedule.scheduleJob('00 01 0 * * *', function() {
  fs.rmdir('/tmp/emblems', function(err) {

  })
  fs.rmdir('/tmp/copywrites', function(err) {

  })
});

module.exports = job;
