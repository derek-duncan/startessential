var cookie = require('lib/middleware/validate/cookie');

module.exports = {
  validate: validate
}

function validate(session, callback) {
  var uid = session._id;
  cookie.validate(uid, {}, callback)
}
