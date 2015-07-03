module.exports = {
  statics: {
    willTransitionTo: function (transition) {
      var nextPath = transition.path;
      if (!UserStore.isLoggedIn()) {
        transition.redirect('/app', {}, { 'nextPath' : nextPath });
      }
    }
  }
}
