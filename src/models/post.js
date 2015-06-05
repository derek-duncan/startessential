"use strict";

var _ = require('lodash');
var moment = require('moment');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * Post schema
 */

var PostSchema = new Schema({
  image_url: {type: String, default: ''},
  day: String,
  title: String,
  content: String,
  category: String,
  fb_post: String,
  share_token: String,
  new_share_token: {type: Boolean, default: false},
  date_created: {type: Date, default: moment},
  date_formatted: {type: String},
  url: {type: String},
  token: {type: String},
  featured: {type: Boolean, default: false}
});

PostSchema.pre('save', function(next) {
  var self = this;
  var imgTag = '<br><img src="' + self.image_url +'">'
  self.fb_post = self.content + imgTag;
  if (this.isNew) {
    self.date_formatted = moment(self.date_created).format('MM/DD/YYYY');
    self.url = '/posts/' + moment(self.date_created).format('YYYY/MM/DD');
  }
  if (this.isNew || self.new_share_token) {
    createShareToken(function(token) {
      self.share_token = token
      next()
    })
  } else {
    next()
  }
})

var Post = mongoose.model('Post', PostSchema);

function createShareToken(done) {
  require('crypto').randomBytes(6, function(err, buf) {
    if (err) throw err;
    var token = buf.toString('hex')
    return done(token);
  });
}

module.exports = Post;
