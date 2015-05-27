function sendEmail(email, done) {
  var MailChimpAPI = require('mailchimp').MailChimpAPI;
  var MailChimpAPIKey = 'f07d6c72ff341a4c4a9fbc3c2c2845ae-us9';
  var api;
  try {
    api = new MailChimpAPI(MailChimpAPIKey, { version : '2.0' });
  } catch (error) {
    return done(new Error('Error while adding email to Mail Chimp.'));
  }
  api.call('lists', 'subscribe', { id: 'b61c1b85db', email: { email: email }, double_optin: false }, function(err) {
    if (err) {
      return done(err);
    }
    //Successfully registered user
    return done(null);
  });
}

module.exports = {
  send: sendEmail
}
