"use strict";

var _ = require('lodash');
var moment = require('moment');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * Post schema
 */

var PostSchema = new Schema({
  image: {
    original: {
      Location: String,
      Key: String
    },
    small: {
      Location: String,
      Key: String
    },
    normal: {
      Location: String,
      Key: String
    }
  },
  day: String,
  title: { type: String },
  content: String,
  category: String,
  share_token: String,
  new_share_token: {type: Boolean, default: false},
  date_created: {type: Date, default: moment},
  date_formatted: {type: String},
  url_path: {type: String},
  token: {type: String},
  featured: {type: Boolean, default: false},
  options: {
    x: {type: Number, default: 0},
    y: {type: Number, default: 0},
    size: Number,
    color: String,
    font: String
  },
  tags: [{type: Schema.Types.ObjectId, ref: 'Tag'}]
});

PostSchema.index({ title: 'text', content: 'text' });

PostSchema.methods.customize = function(user_id, done) {
  var self = this;
  var User = mongoose.model('User');
  var uploader = require('../util/uploader');
  User.findOne({_id: user_id}, function(err, user) {
    if (err) return done(err);
    var options = {
      x: self.options.x,
      y: self.options.y,
      size: self.options.size,
      color: self.options.color,
      text: user.distributor_link
    }
    uploader.customize(self.image.original.Key, user_id, options, done)
  })
}

PostSchema.virtual('url').get(function() {
  return '/posts/' + this.url_path;
})

PostSchema.virtual('tags_flat').get(function() {
  var flat_array = _.map(this.tags, function(obj) {
    return obj.name;
  });
  return flat_array.join(',');
})

PostSchema.pre('save', function(next) {
  var self = this;
  self.url_path = _.kebabCase(self.title);

  if (this.isNew) {
    self.date_formatted = moment(self.date_created).format('MM/DD/YYYY');
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
