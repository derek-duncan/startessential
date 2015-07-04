var UserRecordsStore = require('../stores/UserRecordsStore.js');

var SaveCounter = React.createClass({
  mixins: [
    Reflux.listenTo(UserRecordsStore, 'onStoreUpdate')
  ],
  getInitialState: function() {
    return {
      records: UserRecordsStore.records
    }
  },
  onStoreUpdate: function(records) {
    this.setState({
      records: records
    });
  },
  render: function() {
    var counter;
    if (UserStore.isLoggedIn()) {
      counter = <span className='record-counter'>{this.state.records.downloaded}/{this.state.records.downloads} Saved</span>
    }
    return counter;
  }
});

module.exports = SaveCounter;
