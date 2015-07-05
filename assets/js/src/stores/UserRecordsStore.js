// Actions
var Actions = require('../actions/Actions.js');

var UserRecordsStore = Reflux.createStore({
  init: function() {
    this.listenToMany(Actions);
    this.listenTo(UserStore, this.onUserUpdate);

    this.records = {}
    return this.records;
  },
  onSaveGraphicCompleted: function() {
    if (this.records.downloaded < this.records.downloads) {
      this.records.downloaded += 1;
      this.trigger(this.records)
    } else {
      Actions.addMessage({
        type: 'info',
        text: 'You do not have any downloads left for the week'
      })
    }
  },
  onUserUpdate: function(user) {
    this.records = user.records;
    this.trigger(this.records);
  }
})


module.exports = UserRecordsStore;

