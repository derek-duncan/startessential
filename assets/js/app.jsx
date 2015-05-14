global.React = require('react/addons')
global.Reflux = require('reflux')
global.Router = require('react-router')
global._ = require('lodash');

var attachFastClick = require('fastclick');

var Router = require('react-router');
var { DefaultRoute, Link, Route, RouteHandler } = Router;
var router = require('./src/router');

router.run((Handler, state) => {
  React.render(<Handler {...state}/>, document.body);
});

attachFastClick(document.body);
