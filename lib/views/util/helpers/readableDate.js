var moment = require('moment');

module.exports = function(date) {
  return moment.unix(date).format('MM/DD/YYYY')
}
