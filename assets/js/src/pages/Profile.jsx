var authMixin = require('../mixins/auth.js');
var Profile = React.createClass({
  mixins: [authMixin],
  render: function() {
    return (
      <div>
        <h2>Profile</h2>
      </div>
    )
  }
})

module.exports = Profile;

