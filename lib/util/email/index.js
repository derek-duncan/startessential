var async = require('async');
var constants = require('_/constants');

var stripe = require('stripe')(constants.STRIPE_KEY);
var MailChimpAPI = require('mailchimp').MailChimpAPI;
var MandrillAPI = require('mailchimp').MandrillAPI;

var mailchimp = new MailChimpAPI(constants.MAILCHIMP_KEY, { version: '2.0' })
var mandrill = new MandrillAPI(constants.MANDRILL_KEY);

function sendEmail(message, template, done) {
  var data = {
    template_name: template.name,
    template_content: template.content,
    message: message,
    async: true
  }
  mandrill.call('messages', 'send-template', data, function(err, result) {
    return done(err, result)
  })
}

function saveToList(user, list_id, done) {
  user.email = user.email || '';
  user.name = user.name || '';

  var data = {
    id: list_id,
    email_address: user.email,
    merge_vars: {
      EMAIL: user.email,
      FNAME: user.name
    },
    double_optin: false,
    update_existing: true,
    send_welcome: true
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
    },
    delete_member: true
  }

  mailchimp.call('lists', 'unsubscribe', data, function(err, result) {
    return done(err, result)
  })
}

module.exports = {
  send: sendEmail,
  save: saveToList,
  update: updateEmailInList,
  remove: removeFromEmailList,
  messages: require('./messages.js')
}
