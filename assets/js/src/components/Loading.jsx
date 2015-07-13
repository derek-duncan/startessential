// Requires
var Reflux = require('reflux');
var Router = require('react-router');
var Actions = require('../actions/Actions.js');
var { Navigation } = Router;

var Loading = React.createClass({
  getDefaultProps: function() {
    return {
      isLoading: false
    }
  },
  render: function() {
    var loaded;
    if (this.props.isLoading) {
      loaded = <span>Loading...</span>;
    } else {
      loaded = this.props.children;
    }
    return (
      <div>{loaded}</div>
    )
  }
})

module.exports = Loading;
