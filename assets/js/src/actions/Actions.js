var API = require('../util/API.js');

var actions = Reflux.createActions({
  'login': {asyncResult: true}
});

actions.login.listen(function(fbID) {
  var self = this;
  API.login(fbID).then(function(data) {
    return self.completed(data.user);
  }).catch(function(err) {
    return self.failed(err);
  })
})

module.exports = actions;

