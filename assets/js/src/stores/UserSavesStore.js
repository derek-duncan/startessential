// Requires
var { Navigation } = Router;

// Actions
var Actions = require('../actions/Actions.js');

var UserSavesStore = Reflux.createStore({
  listenables: Actions,

  init: function() {
    this.listenTo(UserStore, this.onUserUpdate)

    this.saves = {
      IDs: [],
      data: []
    }
    return this.saves;
  },
  onGetSavesCompleted: function(saves) {
    this.saves = {
      data: saves
    }
    this.trigger(this.saves);
  },
  onSaveGraphicCompleted: function(graphic) {
    var data = this.saves.data;
    data.append(graphic)
    this.saves = {
      data: saves
    }
    this.trigger(this.saves)
  },
  onUserUpdate: function(user) {
    this.saves.IDs = user.saved_posts
    this.trigger(this.saves)
  }
})


module.exports = UserSavesStore;
