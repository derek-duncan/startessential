var API = require('../util/API.js');

var actions = Reflux.createActions({
  'login': {asyncResult: true},
  'getUser': {asyncResult: true},
  'logout': {},
  'setTitle': {},
  'addMessage': {},
  'resetMessage': {}
});

actions.login.listen(function(fbID) {
  var self = this;
  API.login(fbID).then(function(data) {
    return self.completed(data.user);
  }).catch(function(err) {
    return self.failed(err);
  })
})

actions.getUser.listen(function(uid) {
  var self = this;
  API.getUser(uid).then(function(data) {
    return self.completed(data.user);
  }).catch(function(err) {
    return self.failed(err);
  })
})

module.exports = actions;

