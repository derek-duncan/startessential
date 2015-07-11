module.exports = {
  statics: {
    willTransitionTo: function (transition) {
      var nextPath;
      if (transition.path !== '/app/logout') {
         nextPath = transition.path;
      }
      if (!AuthStore.isLoggedIn()) {
        transition.redirect('/app', {}, { 'nextPath' : nextPath });
      }
    }
  }
}
