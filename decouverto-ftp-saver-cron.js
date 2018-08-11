const schedule = require('node-schedule');
const exec = require('child_process').exec;

schedule.scheduleJob('0 0 0 * * 0', function() {
  exec('node decouverto-ftp-saver-cron.js', console.log);
});
