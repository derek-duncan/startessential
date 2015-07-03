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

    this.trigger(this.user)
    //this.getRemoteUser(updated.uid);
  },
  updateUser: function(user, key) {
    var data = key ? this.user[key] : this.user;
    _.merge(data, user);

    localStorage.setItem('se_user', JSON.stringify(this.user));
  },
  getDefaultUser: function() {
    return this.user;
  },
  isLoggedIn: function() {
    return this.user.isLoggedIn;
  }
})


module.exports = UserStore;


