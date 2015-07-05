// Require
var { Link } = Router;

// Stores
var GraphicsStore = require('../stores/GraphicsStore.js');
var UserSavesStore = require('../stores/UserSavesStore.js');

// Mixins
var authMixin = require('../mixins/auth.js');
var loadingMixin = require('../mixins/loading.js');

// Components
var Loading = require('../components/Loading.jsx');

var Graphics = React.createClass({
  mixins: [
    authMixin,
    loadingMixin,
    Reflux.listenTo(GraphicsStore, 'onStoreUpdate'),
    Reflux.listenTo(UserSavesStore, 'onUserSavesUpdate'),
  ],
  getInitialState: function() {
    return {
      graphics: [],
      featured: {},
      savedIds: []
    }
  },
  componentWillMount: function() {
    this.toggleLoading();
    Actions.getGraphics({
      limit: 3,
      offset: 0
    });
    Actions.getFeatured({
      limit: 1,
      offset: 0,
      featured: true
    });
    Actions.setTitle('Graphics - Start Essential');
  },
  onStoreUpdate: function(graphics) {
    this.toggleLoading(false);
    this.setState({
      graphics: graphics.all,
      featured: graphics.featured
    })
  },
  onUserSavesUpdate: function(saves) {
    this.setState({
      savedIDs: saves.IDs
    })
  },
  handleClick: function(graphic_id) {
    Actions.saveGraphic(graphic_id, AuthStore.auth.uid);
  },
  render: function() {
    var self = this;
    var cx = React.addons.classSet;
    var graphics = [];
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

    this.state.graphics.forEach(function(graphic) {
      var graphicClass = cx({
        'graphic': true,
        'saved': _.includes(self.state.savedIDs, graphic._id)
      });
      graphics.push(
        <div className={graphicClass} onClick={self.handleClick.bind(this, graphic._id)}>
          <img src={graphic.image.small.Location} width='200' />
          <Link to='graphic' params={{ graphic_url: _.get(graphic, 'url_path') }}>{_.get(graphic, 'title')}</Link>
        </div>
      )
    })
    return (
      <Loading isLoading={this.state.loading}>
        <h2>Graphics</h2>
        {featured}
        <hr/>
        {graphics}
      </Loading>
    )
  }
})

module.exports = Graphics;
