// Actions
var Actions = require('../actions/Actions.js');

var SearchStore = Reflux.createStore({
  listenables: Actions,

  init: function() {
    this.results = [];
  },
  onGetSearchCompleted: function(results) {
    this.results = results;
    this.trigger(this.results);
  }
})


module.exports = SearchStore;

