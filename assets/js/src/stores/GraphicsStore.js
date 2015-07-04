// Actions
var Actions = require('../actions/Actions.js');

var GraphicsStore = Reflux.createStore({
  listenables: Actions,

  init: function() {
    this.graphics = [];
  },
  // message is an object with type and message values
  onGetGraphicsCompleted: function(graphics) {
    this.graphics = graphics;
    this.trigger(this.graphics)
  },
})


module.exports = GraphicsStore;
