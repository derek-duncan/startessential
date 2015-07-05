// Stores
var SaveStore = require('../stores/SaveStore.js');

// Mixins
var authMixin = require('../mixins/auth.js');
var loadingMixin = require('../mixins/loading.js');

// Components
var Loading = require('../components/Loading.jsx');

var Save = React.createClass({
  mixins: [
    authMixin,
    loadingMixin,
    Reflux.listenTo(SaveStore, 'onStoreUpdate'),
  ],
  getInitialState: function() {
    return {
      save: []
    }
  },
  componentWillMount: function() {
    this.toggleLoading();
    Actions.getSave(this.props.params.save_code, AuthStore.auth.uid);
    Actions.setTitle('Saved - Start Essential');
  },
  onStoreUpdate: function(save) {
    this.toggleLoading();
    this.setState({
      save: save
    })
  },
  render: function() {
    var self = this;
    var save = this.state.save;

    return (
      <Loading isLoading={this.state.loading}>
        <div className='graphic'>
          <img src={_.get(save, 'custom_image.small.Url')} width='200' />
          <h2>{_.get(save, '_post.title')}</h2>
        </div>
      </Loading>
    )
  }
})

module.exports = Save;

