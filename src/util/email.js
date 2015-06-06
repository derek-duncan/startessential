var nodemailer = require('nodemailer');
var mg = require('nodemailer-mailgun-transport');

// This is your API key that you retrieve from www.mailgun.com/cp (free up to 10K monthly emails)
var auth = {
  auth: {
    api_key: 'key-2d2b5fef649be1fc3fef9446f3ec7794',
    domain: 'startessential.com'
  }
}

var api_key = auth.auth.api_key;
var domain = auth.auth.domain;
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

var nodemailerMailgun = nodemailer.createTransport(mg(auth));

function sendEmail(email, done) {
  nodemailerMailgun.sendMail({
    from: 'admin@startessential.com',
    to: email, // An array if you have multiple recipients.
    subject: 'Hey you, awesome!',
    'h:Reply-To': 'admin@startessential.com',
    //You can use "html:" to send HTML email content. It's magic!
    html: '<b>Thank you for joining Start Essential!</b>' +
          '</br>' +
          '<a href="http://startessential.com/posts">Get started!</a>',
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

function updateEmailInList(oldAddress, newAddress, done) {
  var list = mailgun.lists('mail@startessential.com');

  list.members(oldAddress).update({email: newAddress}, function (err, res) {
    if (done) {
      if (err) return done(err)
      return done(null);
    }
  });
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
