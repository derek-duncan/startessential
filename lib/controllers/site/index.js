var _ = require('lodash')
var constants = require('lib/constants')
var async = require('async')
var moment = require('moment')
var mongoose = require('mongoose')
var Email = require('lib/util/email')
var Joi = require('joi')
var Boom = require('boom')
var _message = require('lib/util/createMessage')

var User = mongoose.model('User');
var Site = mongoose.model('Site');

module.exports = {
  siteHomepage: siteHomepage,
  viewEditForSite: viewEditForSite,
  saveSettingsForSite: saveSettingsForSite,
  viewArticleForSite: viewArticleForSite,
  viewTourForSite: viewTourForSite
}

function siteHomepage( request, reply ) {
  var site_name = request.params.site_name;
  Site.findOne({ name: site_name }).populate('_user').exec(function( err, site ) {
    if ( err ) return reply( Boom.wrap( err ) );
    if (!site) return reply( Boom.notFound() );
    if (site._user && site._user.stripe.trial_expired) return reply( Boom.notFound() );

    return reply.view( 'site/index', {
      title: 'Young Living Distributor Website by ' + site._user.full_name,
      site: site || {}
    });
  });
}

function viewEditForSite( request, reply ) {
  var user_id = request.state.sid._id;

  User.findOne({ _id: user_id }, function(err, user) {
    if (err) return reply(Boom.wrap(err));

    user.createSite(function(err, site) {

      site.content = site.content || {};
      return reply.view( 'site/site', {
        title: 'Site | Start Essential',
        site: site
      });

    });

  });
}

function saveSettingsForSite( request, reply ) {

  var validator = require('validator');
  var user_id = request.state.sid._id;
  var payload = request.payload;

  User.findOne({ _id: user_id }, function(err, user) {
    if (err) return reply(Boom.wrap(err, 500));

    Site.findOne({ _id: user.site }).exec(function(err, site) {
      if (err) return reply(Boom.wrap(err, 500));

      site.options.color = site.options.color || {};
      site.options.color.main = payload.color;
      site.options.color.secondary = payload.secondary;

      site.social.facebook = payload.facebook;
      site.social.pinterest = payload.pinterest;
      site.social.twitter = payload.twitter;
      site.social.instagram = payload.instagram;

      site.contact.email = payload.email;
      site.contact.phone = payload.phone;

      site.content = site.content || {};

      site.content.story = site.content.story || {};
      site.content.story.title = payload.storyTitle;
      site.content.story.content = payload.storyContent;

      var newLinks = [];
      var invalidLink = false;
      _.forIn(payload.links, function(link, key) {

        if (!link.title.length) {
          return;
        }

        if (validator.isURL(link.href)) {
          newLinks.push(link);
        } else {
          invalidLink = true;
        };
      });
      site.content.quick_links = newLinks;

      if (invalidLink) {
        return reply.redirect('/site' + _message('Please enter a valid link'));
      }

      var newAnnouncements = [];
      _.forIn(payload.announcements, function(announcement, key) {

        if (announcement.title.length) {
          newAnnouncements.push(announcement);
        }
      });
      site.content.announcements = newAnnouncements;

      site.save(function(err) {
        return reply.redirect('/site');
      });

    });
  });
}

function viewArticleForSite(request, reply) {

  var site_name = request.params.site_name;
  Site.findOne({ name: site_name }).populate('_user').exec(function( err, site ) {

    var title = site.content.story ? site.content.story.title : 'Article page';
    return reply.view( 'site/story', {
      title: title || 'Article page',
      site: site || {}
    });
  });
}

function viewTourForSite(request, reply) {

  var site_name = request.params.site_name;
  Site.findOne({ name: site_name }).populate('_user').exec(function( err, site ) {

    return reply.view( 'site/tour', {
      title: 'Young Living Essential Oils Tour',
      site: site || {}
    });
  });
}
