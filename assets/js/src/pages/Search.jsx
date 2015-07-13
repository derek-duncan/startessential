// Requires
var Reflux = require('reflux');
var Router = require('react-router');
var Actions = require('../actions/Actions.js');
var { Link } = Router;

// Stores
var SearchStore = require('../stores/SearchStore.js');

// Mixins
var authMixin = require('../mixins/auth.js');
var loadingMixin = require('../mixins/loading.js');

// Components
var Loading = require('../components/Loading.jsx');

var Search = React.createClass({
  mixins: [
    authMixin,
    loadingMixin,
    Reflux.listenTo(SearchStore, 'onStoreUpdate')
  ],
  getInitialState: function() {
    return {
      results: []
    }
  },
  componentWillMount: function() {
    this.toggleLoading();
    Actions.getSearch({
      limit: 10,
      offset: 0,
      q: this.props.query.q
    });
    Actions.setTitle('Search | Start Essential');
  },
  onStoreUpdate: function(results) {
    this.toggleLoading(false);
    this.setState({
      results: results
    })
  },
  render: function() {
    var self = this;
    var cx = React.addons.classSet;
    var results = [];

    this.state.results.forEach(function(result) {
      results.push(
        <div className='result'>
          <img src={result.image.small.Location} width='200' />
          <h4>{result.title}</h4>
        </div>
      )
    })
    return (
      <Loading isLoading={this.state.loading}>
        <h2>Search Results</h2>
        {results}
      </Loading>
    )
  }
})

module.exports = Search;

