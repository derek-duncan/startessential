"use strict";

var _ = require('lodash');
var async = require('async');
var moment = require('moment');
var marked = require('marked');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var shortid = require('shortid');
var autolinks = require('autolinks');

/**
 * Site schema
 */

var SiteSchema = new Schema({
  name: { type: String, },
  options: {
    color: {
      main: String,
      secondary: String,
    }
  },
  social: {
    facebook: String,
    pinterest: String,
    twitter: String,
    instagram: String,
  },
  contact: {
    email: String,
    phone: String,
  },
  content: {
    story: {
      title: String,
      content: String
    },
    quick_links: [{
      title: String,
      href: String
    }],
    announcements: [{
      title: String,
      details: String,
      details_rendered: String
    }]
  },
  _user: { type: Schema.Types.ObjectId, ref: 'User', index: true }
});

SiteSchema.virtual('story_rendered').get(function() {
  if (this.content.story && this.content.story.content) {
    var autoLinked = autolinks(this.content.story.content, 'markdown');
    return marked(autoLinked);
  } else {
    return;
  }
})

SiteSchema.pre('save', function(next) {

  var self = this;

  if (self.contact && self.contact.phone) {
    self.contact.phone = self.contact.phone.replace(/\D/g,'');
  }

  async.each(self.content.announcements, function(announcement, done) {

    if (announcement.details) {
      var autoLinked = autolinks(announcement.details, 'markdown');
      announcement.details_rendered = marked(autoLinked);
    }
    return done();
  }, function() {

    return next();
  });
});

var Site = mongoose.model('Site', SiteSchema);

module.exports = Site;
