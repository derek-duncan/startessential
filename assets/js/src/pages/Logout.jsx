// Requires
var { Navigation } = Router;

// Mixins
var authMixin = require('../mixins/auth.js');

var Logout = React.createClass({
  mixins: [
    Navigation,
    authMixin,
    Reflux.listenTo(Actions.logout, 'onLogout')
  ],
  componentWillMount: function() {
    Actions.setTitle('Logout | Start Essential')
  },
  componentDidMount: function() {
    Actions.logout();
  },
  onLogout: function() {
    this.transitionTo('index');
  },
  render: function() {
    return (
      <h2>Logout</h2>
    )
  }
})

module.exports = Logout;
