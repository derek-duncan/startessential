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
  handleClick: function(graphic_id) {
    Actions.saveGraphic(graphic_id, UserStore.getDefaultUser().uid);
  },
  render: function() {
    var self = this;
    var graphics = [];

    this.state.graphics.forEach(function(graphic) {
      graphics.push(
        <div className='graphic' onClick={self.handleClick.bind(this, graphic._id)}>
          <img src={graphic.image.small.Location} width='200' />
          <h2>{graphic.title}</h2>
        </div>
      )
    })
    return (
      <Loading isLoading={this.state.loading}>
        <h2>Graphics</h2>
        {graphics}
      </Loading>
    )
  }
})

module.exports = Graphics;
