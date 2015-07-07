module.exports = {
  CATEGORIES: ['Aroma', 'Applications'],
  STRIPE_KEY: 'sk_test_8T9RioM6rUcrweVcJ0VluRyG',
  MAILCHIMP_KEY: 'f07d6c72ff341a4c4a9fbc3c2c2845ae-us9',
  MANDRILL_KEY: 'b9o9TRJaZIzZ0hG_lxNjKA',
  SCOPE: {
    PRE_AUTHENTICATED: 'pre_authenticated',
    AUTHENTICATED: 'authenticated',
    ADMIN: 'admin'
  },
  EMAIL_LIST: {
    USERS: 'bc7f28bc8e'
  },
  SUBSCRIPTIONS: {
    TIER_1: {
      NAME: 'basic',
      LIMIT: 2
    },
    TIER_2: {
      NAME: 'standard',
      LIMIT: 5
    }
  },
  application: {
    production: {
      port: process.env.PORT || 3000
    },
    development: {
      port: 3000
    }
  },
  database: {
    production: {
      url: process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/se'
    },
    development: {
      url: 'mongodb://localhost/se-dev'
    }
  }
}
