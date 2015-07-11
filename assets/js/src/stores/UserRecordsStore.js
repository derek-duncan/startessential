// Actions
var Actions = require('../actions/Actions.js');

var UserRecordsStore = Reflux.createStore({
  init: function() {
    this.listenToMany(Actions);
    this.listenTo(UserStore, 'onUserUpdate');

    this.records = {}
  },
  onSaveGraphicCompleted: function() {
    this.records.downloaded += 1;
    this.trigger(this.records)
  },
  onUserUpdate: function(user) {
    this.records = user.records;
    this.trigger(this.records);
  }
})


module.exports = UserRecordsStore;

