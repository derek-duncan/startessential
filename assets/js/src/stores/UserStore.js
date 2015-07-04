var Actions = require('../actions/Actions.js');
var { Navigation } = Router;

var defaultUser = {
  uid: '',
  token: '',
  isLoggedIn: false
};

var UserStore = Reflux.createStore({
  listenables: Actions,

  init: function() {
    var localUser = localStorage.getItem('se_user');
    if (!localUser) {
      this.user = _.clone(defaultUser);
    } else {
      this.user = JSON.parse(localUser);
    }
    return this.user;
  },
  onLoginCompleted: function(user) {
    var updated = {
      uid: user._id,
      token: user.api_token,
      isLoggedIn: true
    };
    this.updateUser(updated);

    this.getRemoteUser(updated.uid);
  },
  onGetUserCompleted: function(userProfile) {
    this.updateUser(userProfile);

    this.trigger(this.user);
  },
  updateUser: function(updatedUser) {
    this.user = _.merge(this.user, updatedUser);

    localStorage.setItem('se_user', JSON.stringify(this.user));
    this.trigger(this.user)
  },
  getRemoteUser: function(uid) {
    Actions.getUser(uid)
  },
  getDefaultUser: function() {
    return this.user;
  },
  onLogout: function() {
    this.user = _.clone(defaultUser);
    localStorage.setItem('se_user', JSON.stringify(this.user));
  },
  isLoggedIn: function() {
    return this.user.isLoggedIn;
  }
})


module.exports = UserStore;


