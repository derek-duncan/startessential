var fs = require('fs'),
    CronJob = require('cron').CronJob,
    job;

job = new CronJob({
  cronTime: '00 01 0 * * *',
  onTick: function() {
    fs.rmdir('/tmp/emblems', function(err) {

    })
  },
  start: true,
  timeZone: 'America/Chicago'
});

module.exports = job;
