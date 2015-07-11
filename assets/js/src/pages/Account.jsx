// Mixins
var authMixin = require('../mixins/auth.js');

var Profile = React.createClass({
  mixins: [
    authMixin
  ],
  componentWillMount: function() {
    Actions.setTitle('Account | Start Essential')
  },
  render: function() {
    return (
      <div>
        <h2>Profile</h2>
        <p>{this.props.user.first_name}</p>
      </div>
    )
  }
})

module.exports = Profile;

