// Requires
var Actions = require('../actions/Actions');
var { Navigation } = Router;

// Stores
var MessageStore = require('../stores/MessageStore');

var Message = React.createClass({
  mixins: [
    Reflux.connect(MessageStore, 'message')
  ],
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
      <div className='messages'>{message}</div>
    )
  }
})

module.exports = Message;

