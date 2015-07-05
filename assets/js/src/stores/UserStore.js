// Requires
var { Navigation } = Router;

// Stores
var AuthStore = require('../stores/AuthStore.js');

// Actions
var Actions = require('../actions/Actions.js');

var UserStore = Reflux.createStore({
  listenables: Actions,

  init: function() {
    //this.listenTo(AuthStore, 'onAuthUpdate');
    this.user = {};
    this.getRemoteUser(AuthStore.auth.uid);
    return this.user;
  },
  onGetUserCompleted: function(userProfile) {
    this.updateUser(userProfile);

    this.trigger(this.user);
  },
  updateUser: function(updatedUser) {
    this.user = _.merge(this.user, updatedUser);

    this.trigger(this.user)
  },
  getRemoteUser: function(uid) {
    Actions.getUser(uid)
  },
  getDefaultUser: function() {
    return this.user;
  }
})


module.exports = UserStore;


