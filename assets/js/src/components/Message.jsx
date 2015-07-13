// Requires
var Reflux = require('reflux');
var Router = require('react-router');
var Actions = require('../actions/Actions.js');
var { Navigation } = Router;

// Stores
var MessageStore = require('../stores/MessageStore');

var Message = React.createClass({
  mixins: [
    Reflux.listenTo(MessageStore, 'onMessage')
  ],
  getInitialState: function() {
    return {
      message: {}
    }
  },
  onMessage: function(message) {
    this.setState({
      message: message
    });
  },
  render: function() {
    var message = '';
    if (_.isObject(this.state.message)) {
      switch (this.state.message.type) {
        case 'error':
          message = <b>{this.state.message.text}</b>
          break;
        case 'info':
          message = <i>{this.state.message.text}</i>
          break;
        default:
          message = ''
          break;
      }
    }
    return (
      <span>{message}</span>
    )
  }
})

module.exports = Message;

