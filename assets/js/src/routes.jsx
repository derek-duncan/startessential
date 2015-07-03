var { Route, DefaultRoute } = Router;

var App = require('./pages/App.jsx');
var Index = require('./pages/Index.jsx');
var Profile = require('./pages/Profile.jsx');

module.exports = (
  <Route name='app' handler={App}>
    <Route name='index' path='/app' handler={Index} />
    <Route name='profile' path='/app/profile' handler={Profile} />
  </Route>
);

