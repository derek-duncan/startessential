var { Route, DefaultRoute } = Router;

var App = require('./pages/App.jsx'),
    Index = require('./pages/Index.jsx');

module.exports = (
  <Route name='app' handler={App}>
    <Route name='index' path='/app' handler={Index} />
  </Route>
);

