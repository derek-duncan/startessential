module.exports = {
  statics: {
    willTransitionTo: function (transition) {
      var nextPath = transition.path;
      if (!AuthStore.isLoggedIn()) {
        transition.redirect('/app', {}, { 'nextPath' : nextPath });
      }
    }
  }
}
