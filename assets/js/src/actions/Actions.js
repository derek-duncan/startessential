var API = require('../util/API.js');

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
  'saveGraphic': {asyncResult: true}
});

actions.login.listen(function(fbID) {
  var self = this;
  API.login(fbID).then(function(data) {
    return self.completed(data);
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

actions.getGraphics.listen(function(options) {
  var self = this;
  API.getGraphics(options).then(function(data) {
    return self.completed(data);
  }).catch(function(err) {
    return self.failed(err);
  })
})

actions.getGraphic.listen(function(graphic_url) {
  var self = this;
  API.getGraphic(graphic_url).then(function(graphic) {
    return self.completed(graphic);
  }).catch(function(err) {
    return self.failed(err);
  })
})

actions.getFeatured.listen(function(options) {
  options.featured = true;
  var self = this;
  API.getGraphics(options).then(function(data) {
    return self.completed(data);
  }).catch(function(err) {
    return self.failed(err);
  })
})

actions.getSaves.listen(function(uid) {
  var self = this;
  API.getSaves(uid).then(function(data) {
    return self.completed(data);
  }).catch(function(err) {
    return self.failed(err);
  })
})

actions.getSave.listen(function(save_code, uid) {
  var self = this;
  API.getSave(save_code, uid).then(function(save) {
    return self.completed(save);
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

