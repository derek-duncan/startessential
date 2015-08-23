var mongoose = require('mongoose')
var cookie = require('lib/middleware/validate/cookie');

var User = mongoose.model('User');

module.exports = {
  validate: validate
}

function validate(token, callback) {
  var request = this;

  if (!token) return callback(null, false)

  User.decode(token, function(err, decoded) {
    cookie.validate(decoded.uid, { token: token }, callback)
  });
}
