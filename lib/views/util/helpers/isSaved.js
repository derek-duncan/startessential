var _ = require('lodash')

module.exports = function(post_id, user) {
  return _.some(user.saved_posts, function(saved_id) {
    return post_id.equals(saved_id)
  })
}
