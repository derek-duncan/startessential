var _ = require('lodash')
var path = require('path')
var jade = require('jade')
var inlineCss = require('inline-css')
var emails = {
  NEW_USER: path.join(__dirname, './user/new.jade'),
  NEW_REFERRAL: path.join(__dirname, './user/referral/new.jade')
}

module.exports.getHTML = function(key, done) {
  var html = jade.renderFile(emails[key])
  inlineCss(html, {
    applyStyleTags: false,
    removeLinkTags: true,
    url: 'http://localhost:3000'
  }, function(err, html) {
    return done(err, html)
  })
}
