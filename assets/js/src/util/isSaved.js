var UserStore = require('../stores/UserStore.js');

module.exports = function(graphic_id) {
  var saved_ids = UserStore.getDefaultUser().saved_posts;
  return _.includes(saved_ids, graphic_id)
};
