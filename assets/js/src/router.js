var { create: createRouter, HistoryLocation, HashLocation } = require('react-router');
var routes = require('./routes.jsx');

var router = createRouter({
  location: process.env.NODE_ENV === 'production' ? HashLocation : HistoryLocation,
  routes: routes
});

module.exports = router;

