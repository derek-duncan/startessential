// Actions
var Actions = require('../actions/Actions.js');

var GraphicStore = Reflux.createStore({
  listenables: Actions,

  init: function() {
    this.graphic = {};
  },
  onGetGraphicCompleted: function(graphic) {
    this.graphic = graphic;
    this.trigger(this.graphic);
  },
})


module.exports = GraphicStore;

