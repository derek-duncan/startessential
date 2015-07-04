// Requires
var { Navigation } = Router;

// Actions
var Actions = require('../actions/Actions.js');

var UserSavesStore = Reflux.createStore({
  listenables: Actions,

  init: function() {
    this.listenTo(UserStore, this.onUserUpdate)

    this.saves = {
      id: [],
      full: []
    }
    return this.saves;
  },
  onUserUpdate: function(user) {
    this.saves.id = user.saved_posts
    this.trigger(this.saves)
  }
})


module.exports = UserSavesStore;
