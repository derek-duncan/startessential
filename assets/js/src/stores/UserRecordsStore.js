// Requires
var Reflux = require('reflux');
var Router = require('react-router');
var Actions = require('../actions/Actions.js');

// Stores
var UserStore = require('../stores/UserStore.js');

var UserRecordsStore = Reflux.createStore({
  init: function() {
    this.listenToMany(Actions);
    this.listenTo(UserStore, 'onUserUpdate');

    this.records = {}
  },
  onSaveGraphicCompleted: function() {
    Actions.addMessage({
      type: 'info',
      text: 'Successfully saved graphic'
    });
    this.records.downloaded += 1;
    this.trigger(this.records)
  },
  onUserUpdate: function(user) {
    this.records = user.records;
    this.trigger(this.records);
  }
})


module.exports = UserRecordsStore;

