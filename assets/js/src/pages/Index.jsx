// Requires
var Reflux = require('reflux');
var Router = require('react-router');
var Actions = require('../actions/Actions.js');

var Login = require('../components/Login.jsx')

var Index = React.createClass({
  componentWillMount: function() {
    Actions.setTitle('Login | Start Essential')
  },
  render: function() {
    return (
      <div>
        <Login />
      </div>
    )
  }
})

module.exports = Index;

