var request = require('superagent');
var _ = require('lodash');

function responseHandler(resolve, reject, err, response) {
  if (response.body.status === 'success') {
    return resolve(response.body.data);
  }
  return reject(response.body.message)
}

function bearer(req) {
  var api_token = AuthStore.auth.api_token;

  if (api_token && api_token.token) req.set('Authorization', 'Bearer ' + api_token.token);
}

function crumb(req) {
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
        .use(bearer)
        .end(responseHandler.bind(this, resolve, reject));
    });
  },
  getGraphics: function(options) {
    return new Promise((resolve, reject) => {
      request
        .get('/api/v1/posts')
        .use(bearer)
        .query(options)
        .end(responseHandler.bind(this, resolve, reject));
    });
  },
  getSaves: function(uid) {
    return new Promise((resolve, reject) => {
      request
        .get('/api/v1/saves')
        .use(bearer)
        .query({
          uid: uid
        })
        .end(responseHandler.bind(this, resolve, reject));
    });
  },
  getSave: function(save_code, uid) {
    return new Promise((resolve, reject) => {
      request
        .get('/api/v1/saves/' + save_code)
        .use(bearer)
        .query({
          uid: uid
        })
        .end(responseHandler.bind(this, resolve, reject));
    });
  },
  saveGraphic: function(graphic_id, uid) {
    return new Promise((resolve, reject) => {
      request
        .post('/api/v1/saves')
        .use(bearer)
        .send({
          uid: uid,
          graphic_id: graphic_id
        })
        .end(responseHandler.bind(this, resolve, reject));
    });
  },
};

module.exports = API;


