var Router = require('react-router');
var { Route, DefaultRoute } = Router;

var App = require('./pages/App.jsx');
var Index = require('./pages/Index.jsx');
var Account = require('./pages/Account.jsx');
var Explore = require('./pages/Explore.jsx');
var Search = require('./pages/Search.jsx');
var Graphic = require('./pages/Graphic.jsx');
var Saved = require('./pages/Saved.jsx');
var Save = require('./pages/Save.jsx');
var Logout = require('./pages/Logout.jsx');

module.exports = (
  <Route name='app' handler={App}>
    <Route name='index' path='/app' handler={Index} />
    <Route name='account' path='/app/account' handler={Account} />
    <Route name='explore' path='/app/explore' handler={Explore} />
    <Route name='search' path='/app/search' handler={Search} />
    <Route name='saved' path='/app/saved' handler={Saved} />
    <Route name='save' path='/app/preview/:save_code' handler={Save} />
    <Route name='graphic' path='/app/graphic/:graphic_url' handler={Graphic} />
    <Route name='logout' path='/app/logout' handler={Logout} />
  </Route>
);

