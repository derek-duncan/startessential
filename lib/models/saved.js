"use strict";

var _ = require('lodash');
var moment = require('moment');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var shortid = require('shortid');

/**
 * Saved schema
 */

var SavedSchema = new Schema({
  custom_image: {
    original: {
      Key: String,
      Location: String
    },
    normal: {
      Key: String,
      Location: String
    },
    small: {
      Key: String,
      Location: String
    }
  },
  date_created: {type: Date, default: Date.now},
  short_code: {type: String, default: shortid.generate },
  posted: { type: Boolean, default: false },
  isOld: { type: Boolean, default: false },
  _user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  _post: { type: Schema.Types.ObjectId, ref: 'Post' }
});

var Saved = mongoose.model('Saved', SavedSchema);

module.exports = Saved;
