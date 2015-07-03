// Requires
var { State, Navigation } = Router;

var Login = React.createClass({
  mixins: [
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

      FB.getLoginStatus(function(response) {
        this.statusChangeCallback(response);
      }.bind(this));
    }.bind(this);
  },
  checkLoginState: function() {
    FB.getLoginStatus(function(response) {
      this.statusChangeCallback(response);
    }.bind(this));
  },
  statusChangeCallback: function(response) {
    if (response.status === 'connected') {
      Actions.login(response.authResponse.userID)
    } else if (response.status === 'not_authorized') { // not logged into app
    } else { // not logged into facebook
    }
  },
  handleClick: function(event) {
    FB.login(this.checkLoginState(), {
      scope: 'email, public_profile, user_friends, publish_actions'
    });
  },
  onStoreUpdate: function(user) {
    var nextPath = this.getQuery().nextPath;
    if (nextPath) {
      this.transitionTo(nextPath);
    } else {
      this.transitionTo('profile');
    }
  },
  render: function() {
    return (
      <a href="#" onClick={this.handleClick}>Login</a>
    )
  }
})

module.exports = Login;

