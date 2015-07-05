// Requires
var { Navigation } = Router;

// Actions
var Actions = require('../actions/Actions.js');

var defaultAuth = {
  uid: '',
  token: '',
  isLoggedIn: false
};

var AuthStore = Reflux.createStore({
  listenables: Actions,

  init: function() {
    var localAuth = localStorage.getItem('se_auth');
    if (!localAuth) {
      this.auth = _.clone(defaultAuth);
    } else {
      this.auth = JSON.parse(localAuth);
    }
    return this.auth;
  },
  onLoginCompleted: function(user) {
    var updated = {
      uid: user._id,
      api_token: user.api_token,
      isLoggedIn: true
    };
    this.updateAuth(updated);

    Actions.getUser(updated.uid);
  },
  updateAuth: function(updatedAuth) {
    this.auth = _.merge(this.auth, updatedAuth);

    localStorage.setItem('se_auth', JSON.stringify(this.auth));
    this.trigger(this.auth)
  },
  onLogout: function() {
    this.auth = _.clone(defaultAuth);
    localStorage.setItem('se_auth', JSON.stringify(this.auth));
  },
  isLoggedIn: function() {
    return this.auth.isLoggedIn;
  }
})


module.exports = AuthStore;



