var authMixin = require('../mixins/auth.js');
var Profile = React.createClass({
  mixins: [authMixin],
  componentWillMount: function() {
    Actions.setTitle('Profile - Start Essential')
  },
  handleClick: function(e) {
    e.preventDefault();
    Actions.getUser(this.props.user.uid)
  },
  render: function() {
    return (
      <div>
        <h2>Profile</h2>
        <p>{this.props.user.first_name}</p>
        <a onClick={this.handleClick} href='#'>Get User</a>
      </div>
    )
  }
})

module.exports = Profile;

