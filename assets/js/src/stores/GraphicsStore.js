// Requires
var Reflux = require('reflux');
var Router = require('react-router');
var Actions = require('../actions/Actions.js');

var GraphicsStore = Reflux.createStore({
  listenables: Actions,

  init: function() {
    this.graphics = {
      all: [],
      featured: {}
    };
  },
  onGetFeaturedCompleted: function(featured) {
    this.graphics.featured = _.isArray(featured) ? featured[0] : featured;
    this.trigger(this.graphics);
  },
  onGetGraphicsCompleted: function(graphics) {
    this.graphics.all = graphics;
    this.trigger(this.graphics);
  },
})


module.exports = GraphicsStore;
