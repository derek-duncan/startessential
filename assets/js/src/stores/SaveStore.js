// Requires
var { Navigation } = Router;

// Actions
var Actions = require('../actions/Actions.js');

var SaveStore = Reflux.createStore({
  listenables: Actions,

  init: function() {
    this.save = {}
    return this.save;
  },
  onGetSaveCompleted: function(save) {
    this.save = save
    this.trigger(this.save);
  }
})


module.exports = SaveStore;
