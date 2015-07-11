var API = require('../util/API.js');

function responseHandler(err, response) {
  var self = this;
  if (response.body.status === 'success') {
    return self.completed(response.body.data);
  }
  if (response.status === 401) {
    Actions.logout();
  }
  if (response.body.message) {
    Actions.addMessage({
      type: 'error',
      text: response.body.message
    });
  }
  return self.failed(response.body.message || 'Unknown error');
}

var actions = Reflux.createActions({
  'login': {asyncResult: true},
  'getUser': {asyncResult: true},
  'logout': {},
  'setTitle': {},
  'addMessage': {},
  'resetMessage': {},
  'getGraphics': {asyncResult: true},
  'getGraphic': {asyncResult: true},
  'getFeatured': {asyncResult: true},
  'getSaves': {asyncResult: true},
  'getSave': {asyncResult: true},
  'saveGraphic': {asyncResult: true},
  'getSearch': {asyncResult: true}
});

actions.login.listen(function(fbID) {
  var self = this;
  API.login(fbID, responseHandler.bind(self));
})

actions.getUser.listen(function(uid) {
  var self = this;
  API.getUser(uid, responseHandler.bind(self));
})

actions.getGraphics.listen(function(options) {
  var self = this;
  API.getGraphics(options, responseHandler.bind(self))
})

actions.getGraphic.listen(function(graphic_url) {
  var self = this;
  API.getGraphic(graphic_url, responseHandler.bind(self))
})

actions.getFeatured.listen(function(options) {
  options.featured = true;
  var self = this;
  API.getGraphics(options, responseHandler.bind(self))
})

actions.getSaves.listen(function(uid) {
  var self = this;
  API.getSaves(uid, responseHandler.bind(self))
})

actions.getSave.listen(function(save_code, uid) {
  var self = this;
  API.getSave(save_code, uid, responseHandler.bind(self))
})

actions.saveGraphic.listen(function(graphic_id, uid) {
  var self = this;
  API.saveGraphic(graphic_id, uid, responseHandler.bind(self))
})

actions.getSearch.listen(function(options) {
  var self = this;
  API.getSearch(options, responseHandler.bind(self))
})

module.exports = actions;

