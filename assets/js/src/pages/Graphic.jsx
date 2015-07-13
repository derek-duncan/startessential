// Requires
var Reflux = require('reflux');
var Router = require('react-router');
var Actions = require('../actions/Actions.js');

// Stores
var GraphicStore = require('../stores/GraphicStore.js');

// Mixins
var authMixin = require('../mixins/auth.js');
var loadingMixin = require('../mixins/loading.js');

// Components
var Loading = require('../components/Loading.jsx');

var Graphic = React.createClass({
  mixins: [
    authMixin,
    loadingMixin,
    Reflux.listenTo(GraphicStore, 'onStoreUpdate'),
  ],
  getInitialState: function() {
    return {
      graphic: {}
    }
  },
  componentWillMount: function() {
    this.toggleLoading();
    Actions.getGraphic(this.props.params.graphic_url);
  },
  onStoreUpdate: function(graphic) {
    Actions.setTitle(graphic.title + ' | Start Essential');
    this.toggleLoading();
    this.setState({
      graphic: graphic
    })
  },
  render: function() {
    var self = this;
    var graphic = this.state.graphic;

    return (
      <Loading isLoading={this.state.loading}>
        <div className='graphic'>
          <img src={_.get(graphic, 'image.small.Location')} width='200' />
          <h2>{_.get(graphic, '_post.title')}</h2>
        </div>
      </Loading>
    )
  }
})

module.exports = Graphic;


