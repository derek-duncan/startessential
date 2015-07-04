// Actions
var Actions = require('../actions/Actions.js');

var UserRecordsStore = Reflux.createStore({
  listenables: Actions,

  init: function() {
    this.listenTo(UserStore, this.onUserUpdate)

    this.records = {
      downloads: 2,
      downloaded: 0
    }
    return this.records;
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

