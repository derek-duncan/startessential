var UserRecordsStore = require('../stores/UserRecordsStore.js');

var SaveCounter = React.createClass({
  mixins: [
    Reflux.listenTo(UserRecordsStore, 'onStoreUpdate'),
  ],
  getDefaultProps: function() {
    return {
      user: {}
    }
  },
  getInitialState: function() {
    return {
      records: {}
    }
  },
  onStoreUpdate: function(records) {
    this.setState({
      records: records
    });
  },
  render: function() {
    var counter;
    if (!_.isEmpty(this.props.user)) {
      counter = <span className='record-counter'>{this.state.records.downloaded}/{this.state.records.downloads} Saved</span>
    } else {
      counter = <span></span>;
    }
    return counter;
  }
});

module.exports = SaveCounter;
