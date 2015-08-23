var _ = require('lodash')
var constants = require('lib/constants');
var async = require('async');
var moment = require('moment');
var mongoose = require('mongoose');
var Saved = mongoose.model('Saved');
var Boom = require('boom');

module.exports = {
  generateSitemap: generateSitemap,
}

function generateSitemap(request, reply) {
  Saved.find({}).lean().exec(function(err, saves) {
    var urls = {
      'urlset': {
        '@xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9',
        '#list': []
      }
    }
    async.each(saves, function(save, done) {
      urls['urlset']['#list'].push({
        url: {
          loc: "https://startessential.com/preview/" + save.short_code,
          lastmod: moment(save.date_created).format('YYYY-MM-DD'),
          changefreq: "yearly",
          priority: '0.9'
        }
      })
      return done()
    }, function() {
      var customURLs = {
        url: {
          loc: 'https://startessential.com/',
          changefreq: 'monthly',
          priority: '0.8'
        },
        url: {
          loc: 'https://startessential.com/register',
          changefreq: "monthly",
          priority: '0.6'
        }
      }
      urls['urlset']['#list'].push(customURLs)

      var builder = require('xmlbuilder');

      var xml = builder.create(urls)
      xml.dec('1.0', 'UTF-8')

      var str = xml.end({ pretty: true});
      return reply(str)
        .type('text/xml');
    });
  });
}
