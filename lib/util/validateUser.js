var _ = require('lodash')
var constants = require('lib/constants')
var async = require('async')
var mongoose = require('mongoose')

var User = mongoose.model('User');

module.exports = {
  validate: _validate
}

function _validate(uid, callbackObject, done) {
  async.waterfall([
    function(done) {
      User.findOne({_id: uid}, function(err, user) {
        if (user) {
          if (!user.logged_in) {
            return done(null, false)
          }
          var scope = []
          switch (user.scope) {
            case constants.SCOPE.PRE_AUTHENTICATED:
              scope = [constants.SCOPE.PRE_AUTHENTICATED]
              break;
            case constants.SCOPE.AUTHENTICATED:
              scope = [constants.SCOPE.PRE_AUTHENTICATED, constants.SCOPE.AUTHENTICATED]
              break;
            case constants.SCOPE.ADMIN:
              scope = [constants.SCOPE.PRE_AUTHENTICATED, constants.SCOPE.AUTHENTICATED, constants.SCOPE.ADMIN]
              break;
            default:
              scope = [constants.SCOPE.PRE_AUTHENTICATED]
              break;
          }
          callbackObject = _.assign(callbackObject, { scope: scope});
          return done(null, true, callbackObject)
        }
        return done(null, false)
      })
    }
  ], function(err, isValid, obj) {
    return done(err, isValid, obj)
  })
}
