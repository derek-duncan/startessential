var { Route, DefaultRoute } = Router;

var App = require('./pages/App.jsx');
var Index = require('./pages/Index.jsx');
var Account = require('./pages/Account.jsx');
var Explore = require('./pages/Explore.jsx');

module.exports = (
  <Route name='app' handler={App}>
    <Route name='index' path='/app' handler={Index} />
    <Route name='account' path='/app/account' handler={Account} />
    <Route name='explore' path='/app/explore' handler={Explore} />
  </Route>
);

