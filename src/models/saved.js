"use strict";

var _ = require('lodash');
var moment = require('moment');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * Saved schema
 */

var SavedSchema = new Schema({
  custom_image: {
    key: String,
    url: String
  },
  posted: { type: Boolean, default: false },
  isOld: { type: Boolean, default: false },
  _user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  _post: { type: Schema.Types.ObjectId, ref: 'Post' }
});

var Saved = mongoose.model('Saved', SavedSchema);

module.exports = Saved;
