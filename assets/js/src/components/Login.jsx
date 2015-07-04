// Requires
var { State, Navigation } = Router;

// Components
var Loading = require('../components/Loading.jsx');

// Mixins
var loadingMixin = require('../mixins/loading.js');

var Login = React.createClass({
  mixins: [
    loadingMixin,
    State,
    Navigation,
    Reflux.listenTo(UserStore, 'onStoreUpdate')
  ],
  componentDidMount: function() {
    window.fbAsyncInit = function() {
      FB.init({
        appId: '1589098114709228',
        cookie: true,
        xfbml: true,
        version: 'v2.3'
      });
    }.bind(this);
  },
  checkLoginState: function() {
    FB.getLoginStatus(function(response) {
      this._statusChangeCallback(response);
    }.bind(this));
  },
  _statusChangeCallback: function(response) {
    if (response.status === 'connected') {
      Actions.login(response.authResponse.userID)
    } else if (response.status === 'not_authorized') { // not logged into app
    } else { // not logged into facebook
    }
  },
  handleClick: function(event) {
    this.toggleLoading();
    FB.login(this.checkLoginState(), {
      scope: 'email, public_profile, user_friends, publish_actions'
    });
  },
  onStoreUpdate: function(user) {
    this.toggleLoading();
    var nextPath = this.getQuery().nextPath;
    if (nextPath) {
      this.transitionTo(nextPath);
    } else {
      this.transitionTo('account');
    }
  },
  render: function() {
    return (
      <Loading isLoading={this.state.loading}>
        <a href="#" onClick={this.handleClick}>Login</a>
      </Loading>
    )
  }
})

module.exports = Login;

