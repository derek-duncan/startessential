var async = require('async');
var constants = require('_/constants');

// This is your API key that you retrieve from www.mailgun.com/cp (free up to 10K monthly emails)
var auth = {
  auth: {
    api_key: constants.MAILGUN_KEY,
    domain: 'startessential.com'
  }
}

var api_key = auth.auth.api_key;
var domain = auth.auth.domain;
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});
var stripe = require('stripe')(constants.STRIPE_KEY);

var nodemailer = require('nodemailer');
var mg = require('nodemailer-mailgun-transport');
var nodemailerMailgun = nodemailer.createTransport(mg(auth));

function sendEmail(email, message, done) {
  nodemailerMailgun.sendMail({
    from: 'admin@startessential.com',
    to: email, // An array if you have multiple recipients.
    subject: 'Hey you, awesome!',
    'h:Reply-To': 'admin@startessential.com',
    //You can use "html:" to send HTML email content. It's magic!
    html: message,
  }, function (err, info) {
    if (err) return done(err)
    return done(null);
  });
}

function saveToList(user, done) {
  user.email = user.email || '';
  user.name = user.name || '';

  var data = {
    subscribed: true,
    address: user.email,
    name: user.name
  }

  var list = mailgun.lists('mail@startessential.com');

  list.members().create(data, function (err, res) {
    if (err) return done(err)
    return done(null);
  });
}

function updateEmailInList(oldAddress, newAddress, stripe_id, done) {
  async.parallel([
    function(done) {
      var list = mailgun.lists('mail@startessential.com');
      list.members(oldAddress).update({email: newAddress}, function (err, res) {
        if (err) return done(err)
        return done(null);
      });
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

function removeFromEmailList(address, done) {
  var list = mailgun.lists('mail@startessential.com');

  list.members(address).delete(function(err) {
    if (done) {
      if (err) return done(err)
      return done(null)
    }
  })
}

module.exports = {
  send: sendEmail,
  save: saveToList,
  update: updateEmailInList,
  remove: removeFromEmailList
}
