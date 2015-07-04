// Stores
var GraphicsStore = require('../stores/GraphicsStore.js');

// Mixins
var authMixin = require('../mixins/auth.js');
var loadingMixin = require('../mixins/loading.js');

// Components
var Loading = require('../components/Loading.jsx');

var Graphics = React.createClass({
  mixins: [
    authMixin,
    loadingMixin,
    Reflux.listenTo(GraphicsStore, 'onStoreUpdate')
  ],
  getInitialState: function() {
    return {
      graphics: []
    }
  },
  componentWillMount: function() {
    this.toggleLoading();
    Actions.getGraphics(3, 0);
    Actions.setTitle('Graphics - Start Essential');
  },
  onStoreUpdate: function(graphics) {
    this.toggleLoading();
    this.setState({
      graphics: graphics
    })
  },
  render: function() {
    var graphics = [];

    this.state.graphics.forEach(function(graphic) {
      graphics.push(
        <div className='graphic'>
          <img src={graphic.image.small.Location} width='200' />
          <h2>{graphic.title}</h2>
        </div>
      )
    })

    var loaded;
    if (this.state.loading) {
      loaded = <Loading />;
    } else {
      loaded = graphics;
    }
    return (
      <div>
        <h2>Graphics</h2>
        {loaded}
      </div>
    )
  }
})

module.exports = Graphics;
