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
      var SCOPE = constants.SCOPE;
      User.findOne({_id: uid}, function(err, user) {
        if (user) {
          if (!user.logged_in) {
            return done(null, false)
          }
          //if (user.stripe.trial_expired) {
          //  if (user.scope !== SCOPE.AUTHENTICATED || user.scope !== SCOPE.ADMIN) {
          //    return done(null, false)
          //  }
          //}
          var scope = []
          switch (user.scope) {
            case SCOPE.PRE_AUTHENTICATED:
              scope = [SCOPE.PRE_AUTHENTICATED]
              break;
            case SCOPE.AUTHENTICATED:
              scope = [SCOPE.PRE_AUTHENTICATED, SCOPE.AUTHENTICATED]
              break;
            case SCOPE.ADMIN:
              scope = [SCOPE.PRE_AUTHENTICATED, SCOPE.AUTHENTICATED, SCOPE.ADMIN]
              break;
            default:
              scope = [SCOPE.PRE_AUTHENTICATED]
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
