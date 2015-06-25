"use strict";

var moment = require('moment');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Token = new Schema({
    token: {type: String},
    date_created: {type: Date, default: Date.now},
    expires: { type: Date, expires: '24h', default: Date.now }
});

Token.statics.hasExpired= function(created) {
    var now = moment().valueOf();
    var diff = (now - created);
    return diff > moment.duration(24, 'h').asMilliseconds(); // 30 min
};

var Token = mongoose.model('Token', Token);

