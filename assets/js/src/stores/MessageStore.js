// Requires
var Reflux = require('reflux');
var Router = require('react-router');
var Actions = require('../actions/Actions.js');

var MessageStore = Reflux.createStore({
  listenables: Actions,

  init: function() {
    this.messages = [];
  },
  // message is an object with type and message values
  onAddMessage: function(message, noHide) {
    var messages = this.messages.slice();
    messages.push(message);
    this.trigger(messages[messages.length - 1]);
    $('body').addClass('messages');
    if (!noHide) {
      setTimeout(() => {
        Actions.resetMessage();
      }, 5000);
    }
  },
  onResetMessage: function() {
    this.messages = [];
    $('body').removeClass('messages');
    this.trigger();
  }
})


module.exports = MessageStore;


