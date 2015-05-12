module.exports = function() {
  return [
    {
      method: 'GET',
      path: '/',
      handler: function (request, reply) {
        reply.view('index', {
          title: 'Everything you need to grow your Essential Oil business'
        });
      }
    },
    {
      method: 'GET',
      path: '/thankyou',
      handler: function (request, reply) {
        reply.view('thankyou', {
          title: 'Thank you for joining Start Essential!'
        });
      }
    },
    {
      method: 'GET',
      path: '/{param*}',
      handler: {
        directory: {
          path: 'assets'
        }
      }
    }
  ]
}
