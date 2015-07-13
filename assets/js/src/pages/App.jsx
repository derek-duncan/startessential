// Requires
var Reflux = require('reflux');
var Router = require('react-router');
var Actions = require('../actions/Actions.js');
var DocumentTitle = require('react-document-title');
var { Link, RouteHandler, Navigation } = Router;

// Components
var Header = require('../components/Header.jsx');
var Message = require('../components/Message.jsx');

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
          <Header user={this.state.user} />
          <div className='all-content'>
            <main className='main'>
              <RouteHandler {...this.props} user={ this.state.user } />
            </main>
          </div>
          <div className='push'></div>
        </div>
      </DocumentTitle>
    )
  }
})

module.exports = App;
