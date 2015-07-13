// Requires
var Reflux = require('reflux');
var Router = require('react-router');
var Actions = require('../actions/Actions.js');
var { Navigation } = Router;

// Actions
var Actions = require('../actions/Actions.js');

var UserSavesStore = Reflux.createStore({
  listenables: Actions,

  init: function() {
    this.saves = [];
    return this.saves;
  },
  onGetSavesCompleted: function(saves) {
    this.saves = saves;
    this.trigger(this.saves);
  },
  onSaveGraphicCompleted: function(graphic) {
    this.saves.push(graphic)
    this.trigger(this.saves)
  }
})


module.exports = UserSavesStore;
