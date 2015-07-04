var defaults = require('superagent-defaults');
var request = defaults();
var _ = require('lodash');

function responseHandler(resolve, reject, err, response) {
  console.log(this)
  if (response.ok) {
    return resolve(response.body.data);
  }
  if (response.status === 401) {
    Actions.logout();
  }
  return reject(response.body.message)
}

var API = {
  login: function(fbID) {
    return new Promise((resolve, reject) => {
      request
        .post('/api/v1/login')
        .send({ fbID: fbID })
        .end(responseHandler.bind(this, resolve, reject));
    });
  },
  getUser: function(uid) {
    return new Promise((resolve, reject) => {
      request
        .get('/api/v1/users/'+uid)
        .set('access_token', UserStore.getDefaultUser().token.token)
        .end(responseHandler.bind(this, resolve, reject));
    });
  }
};

module.exports = API;


