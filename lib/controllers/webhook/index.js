var _ = require('lodash')
var constants = require('lib/constants')
var async = require('async')
var Email = require('lib/util/email')
var stripe = require('stripe')(constants.STRIPE_KEY);

module.exports = {
  discountCreated: discountCreated
}

function discountCreated(request, reply) {
  var payload = request.payload.data.object;
  var coupon = payload.coupon;
  var template = require('lib/util/email/templates/coupon-created');

  stripe.customers.retrieve( payload.customer, function(err, customer) {
    if (customer) {
      template.locals = {
        email: customer.email,
        percent: payload.percent_off
      }
      Email.sendEmail(template, function(err) {
        return reply()
      });
    }
    return reply();
  });
}
