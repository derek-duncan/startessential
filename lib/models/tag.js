"use strict";

var _ = require('lodash');
var moment = require('moment');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * Tag schema
 */

var TagSchema = new Schema({
  name: String,
  date_created: {type: Date, default: moment}
})

TagSchema.statics.createOrFind = function createOrFind(tagName, callback) {
  var self = this;
  self.findOne({ name: tagName }, function(err, tag) {
    if (err) return callback(err)
    if (tag) {
      return callback(null, tag)
    }
    var newTag = new self({
      name: tagName.toLowerCase()
    });
    newTag.save(function(err) {
      if (err) return callback(err)
      return callback(null, newTag)
    })
  })
}

var Tag = mongoose.model('Tag', TagSchema);

module.exports = Tag;
