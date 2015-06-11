"use strict";

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

/**
 * IP schema
 */

var IpSchema = new Schema({
  ip: {type: String},
  date_created: {type: Date, default: Date.now},
});

var IP = mongoose.model('IP', IpSchema);

module.exports = IP;
