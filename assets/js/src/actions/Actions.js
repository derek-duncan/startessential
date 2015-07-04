var API = require('../util/API.js');

var actions = Reflux.createActions({
  'login': {asyncResult: true},
  'getUser': {asyncResult: true},
  'logout': {},
  'setTitle': {},
  'addMessage': {},
  'resetMessage': {},
  'getGraphics': {asyncResult: true},
  'saveGraphic': {asyncResult: true}
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

actions.getGraphics.listen(function(limit, offset) {
  var self = this;
  API.getGraphics(limit, offset).then(function(data) {
    return self.completed(data);
  }).catch(function(err) {
    return self.failed(err);
  })
})

actions.saveGraphic.listen(function(graphic_id, uid) {
  var self = this;
  API.saveGraphic(graphic_id, uid).then(function(data) {
    return self.completed(data);
  }).catch(function(err) {
    return self.failed(err);
  })
})

module.exports = actions;

