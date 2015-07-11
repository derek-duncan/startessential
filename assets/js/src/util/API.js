var request = require('superagent');
var _ = require('lodash');

function bearer(req) {
  var api_token = AuthStore.auth.api_token;

  if (api_token && api_token.token) req.set('Authorization', 'Bearer ' + api_token.token);
}

function crumb(req) {
}

var API = {
  login: function(fbID, done) {
    request
      .post('/api/v1/login')
      .send({ fbID: fbID })
      .end(done);
  },
  getUser: function(uid, done) {
    request
      .get('/api/v1/users/'+uid)
      .use(bearer)
      .end(done);
  },
  getSearch: function(options, done) {
    request
      .get('/api/v1/search')
      .use(bearer)
      .query(options)
      .end(done);
  },
  getGraphics: function(options, done) {
    request
      .get('/api/v1/posts')
      .use(bearer)
      .query(options)
      .end(done);
  },
  getGraphic: function(graphic_url, done) {
    request
      .get('/api/v1/posts/'+graphic_url)
      .use(bearer)
      .end(done);
  },
  getSaves: function(uid, done) {
    request
      .get('/api/v1/saves')
      .use(bearer)
      .query({
        uid: uid
      })
      .end(done);
  },
  getSave: function(save_code, uid, done) {
    request
      .get('/api/v1/saves/' + save_code)
      .use(bearer)
      .query({
        uid: uid
      })
      .end(done);
  },
  saveGraphic: function(graphic_id, uid, done) {
    request
      .post('/api/v1/saves')
      .use(bearer)
      .send({
        uid: uid,
        graphic_id: graphic_id
      })
      .end(done);
  },
};

module.exports = API;


