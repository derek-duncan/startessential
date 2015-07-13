// Requires
var Reflux = require('reflux');
var Router = require('react-router');
var Actions = require('../actions/Actions.js');
var { Link } = Router;

// Stores
var GraphicsStore = require('../stores/GraphicsStore.js');

// Mixins
var authMixin = require('../mixins/auth.js');
var loadingMixin = require('../mixins/loading.js');

// Components
var Loading = require('../components/Loading.jsx');
var Grid = require('../components/Grid.jsx');

// Util
var isSaved = require('../util/isSaved.js');

var Graphics = React.createClass({
  mixins: [
    authMixin,
    loadingMixin,
    Reflux.listenTo(GraphicsStore, 'onStoreUpdate')
  ],
  getInitialState: function() {
    return {
      graphics: [],
      featured: {}
    }
  },
  componentWillMount: function() {
    this.toggleLoading();
    Actions.getGraphics({
      limit: 8,
      offset: 0
    });
    Actions.getFeatured({
      limit: 1,
      offset: 0,
      featured: true
    });
    Actions.setTitle('Graphics | Start Essential');
  },
  onStoreUpdate: function(graphics) {
    this.toggleLoading(false);
    this.setState({
      graphics: graphics.all,
      featured: graphics.featured
    })
  },
  getFeatureToRender: function() {
    var featured;
    if (_.isEmpty(this.state.featured)) {
      featured = <div></div>;
    } else {
      featured = (
        <div className='featured'>
          <img src={_.get(this.state.featured, 'image.small.Location')} width='200'/>
          <Link to='graphic' params={{ graphic_url: _.get(this.state.featured, 'url_path') }}>{_.get(this.state.featured, 'title')}</Link>
        </div>
      )
    }
    return featured;
  },
  render: function() {
    var self = this;
    return (
      <Loading isLoading={this.state.loading}>
        <h2>Graphics</h2>
        {self.getFeatureToRender()}
        <hr/>
        <div className='graphics'>
          <Grid items={this.state.graphics} />
        </div>
      </Loading>
    )
  }
})

module.exports = Graphics;
