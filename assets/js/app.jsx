global.React = require('react/addons')
global.Reflux = require('reflux')
global.Router = require('react-router')
global._ = require('lodash');
global.UserStore = require('./src/stores/UserStore.js')
global.AuthStore = require('./src/stores/AuthStore.js')
global.Actions = require('./src/actions/Actions.js')

var attachFastClick = require('fastclick');

var { DefaultRoute, Link, Route, RouteHandler } = Router;
var router = require('./src/router');

router.run((Handler, state) => {
  React.render(<Handler {...state}/>, document.body);
});

attachFastClick(document.body);
