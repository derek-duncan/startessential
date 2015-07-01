var async = require('async');
var constants = require('_/constants');
var path = require('path')

var stripe = require('stripe')(constants.STRIPE_KEY);
var MailChimpAPI = require('mailchimp').MailChimpAPI;
var MandrillAPI = require('mailchimp').MandrillAPI;
var emailTemplates = require('email-templates')

var mailchimp = new MailChimpAPI(constants.MAILCHIMP_KEY, { version: '2.0' })
var mandrill = new MandrillAPI(constants.MANDRILL_KEY);


function sendEmail(template, done) {
  template.name = template.name || '';
  template.locals = template.locals || {};
  template.subject = template.subject || 'Start Essential';
  var templateDir = path.resolve(__dirname, 'templates');

  emailTemplates(templateDir, function(err, render) {
    render(template.name, template.locals, function(err, html, text) {
      var message = {
        html: html,
        text: text,
        subject: template.subject,
        from_email: 'admin@startessential.com',
        from_name: 'Start Essential',
        to: [
          {
            email: template.locals.email,
            name: template.locals.fname
          }
        ]
      }

      var data = {
        message: message,
        async: true
      }
      mandrill.call('messages', 'send', data, function(err, result) {
        return done(err, result)
      })
    })
  })
}

function saveToList(user, list_id, done) {
  user.email = user.email || '';
  user.name = user.name || {};
  user.name.first = user.name.first || '';
  user.name.last = user.name.last || '';

  var data = {
    id: list_id,
    email: {
      email: user.email
    },
    merge_vars: {
      EMAIL: user.email,
      FNAME: user.name.first,
      LNAME: user.name.last,
    },
    double_optin: false,
    update_existing: true
  }

  mailchimp.call('lists', 'subscribe', data, function(err, result) {
    return done(err, result)
  })
}

function updateEmailInList(oldAddress, newAddress, stripe_id, list_id, done) {
  async.parallel([
    function(done) {
      var data = {
        id: list_id,
        email: {
          email: oldAddress
        },
        merge_vars: {
          'new-email': newAddress
        }
      }
      mailchimp.call('lists', 'update-member', data, function(err, result) {
        return done(err, result)
      })
    },
    function(done) {
      stripe.customers.update(stripe_id, {
        email: newAddress
      }, function(err) {
        if (err) return done(err)
        return done()
      })
    }
  ], function(err) {
    if (done) {
      return done(err)
    }
  })
}

function removeFromEmailList(email, list_id, done) {
  var data = {
    id: list_id,
    email: {
      email: email
    }
  }

  mailchimp.call('lists', 'unsubscribe', data, function(err, result) {
    return done(err, result)
  })
}

module.exports = {
  send: sendEmail,
  save: saveToList,
  update: updateEmailInList,
  remove: removeFromEmailList
}

