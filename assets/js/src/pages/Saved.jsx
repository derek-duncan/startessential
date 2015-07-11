// Requires
var { Link } = Router;

// Stores
var UserSavesStore = require('../stores/UserSavesStore.js');

// Mixins
var authMixin = require('../mixins/auth.js');
var loadingMixin = require('../mixins/loading.js');

// Components
var Loading = require('../components/Loading.jsx');

var Saved = React.createClass({
  mixins: [
    authMixin,
    loadingMixin,
    Reflux.listenTo(UserSavesStore, 'onStoreUpdate'),
  ],
  getInitialState: function() {
    return {
      saves: []
    }
  },
  componentWillMount: function() {
    this.toggleLoading();
    Actions.getSaves(AuthStore.auth.uid);
    Actions.setTitle('Saved | Start Essential');
  },
  onStoreUpdate: function(saves) {
    this.toggleLoading();
    this.setState({
      saves: saves.data
    })
  },
  render: function() {
    var self = this;
    var cx = React.addons.classSet;
    var saves = [];

    this.state.saves.forEach(function(save) {
      saves.push(
        <div className='graphic'>
          <img src={save.custom_image.small.Url} width='200' />
          <Link to='save' params={{save_code: save.short_code}}>{save._post.title}</Link>
        </div>
      )
    })
    return (
      <Loading isLoading={this.state.loading}>
        <h2>Saved Graphics</h2>
        {saves}
      </Loading>
    )
  }
})

module.exports = Saved;
