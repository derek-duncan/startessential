"use strict";

var _ = require('lodash');
var moment = require('moment');
var marked = require('marked');
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
  title: String,
  short_description: String,
  content: String,
  category: String,
  published: { type: Boolean, default: false },
  date_created: {type: Date, default: moment},
  date_published: {type: Date},
  date_formatted: {type: String},
  url_path: {type: String},
  token: {type: String},
  featured: {type: Boolean, default: false},
  options: {
    x: {type: Number, default: 0},
    y: {type: Number, default: 0},
  },
  tags: [{type: Schema.Types.ObjectId, ref: 'Tag'}]
});

PostSchema.virtual('url').get(function() {
  return '/posts/' + this.url_path;
})

PostSchema.virtual('tags_flat').get(function() {
  var flat_array = _.map(this.tags, function(obj) {
    return obj.name;
  });
  return flat_array.join(',');
})

PostSchema.virtual('content_rendered').get(function() {
  return marked(this.content);
})

PostSchema.virtual('short_description_rendered').get(function() {
  return marked(this.short_description);
})

PostSchema.pre('save', function(next) {
  var self = this;
  self.url_path = _.kebabCase(self.title);

  if (this.isNew) {
    self.date_formatted = moment(self.date_created).format('MM/DD/YYYY');
  }
  next()
})

var Post = mongoose.model('Post', PostSchema);

module.exports = Post;
