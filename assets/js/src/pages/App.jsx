var DocumentTitle = require('react-document-title');
var Message = require('../components/Message.jsx');
var { Link, RouteHandler, Navigation } = Router;

var App = React.createClass({
  mixins: [
    Navigation,
    Reflux.listenTo(UserStore, 'onStoreUpdate'),
    Reflux.listenTo(Actions.setTitle, "onSetTitle"),
  ],
  getInitialState: function() {
    return {
      user: UserStore.getDefaultUser(),
      title: 'Start Essential'
    };
  },
  onSetTitle: function(title) {
    this.setState({
      title: title
    })
  },
  onStoreUpdate: function(user) {
    this.setState({
      user: user
    });
  },
  render: function() {
    return (
      <DocumentTitle title={this.state.title}>
        <div>
          <Message />
          <h1>Welcome to Start Essential</h1>
          <RouteHandler {...this.props} user={ this.state.user } />
        </div>
      </DocumentTitle>
    )
  }
})

module.exports = App;
