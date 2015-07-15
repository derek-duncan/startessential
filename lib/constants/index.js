module.exports = {
  CATEGORIES: ['Aroma', 'Applications'],
  STRIPE_KEY: process.env.NODE_ENV === 'production' ? 'sk_live_6qb0aMgWyyQgxDz9iCmzeEzd' : 'sk_test_8T9RioM6rUcrweVcJ0VluRyG',
  STRIPE_KEY_PK: process.env.NODE_ENV === 'production' ? 'pk_live_D9cfyIue8Lo3R2GlwhTtUlA6' : 'pk_test_QSKUtc94PM7XpNBHBmC3LyLA',
  MAILCHIMP_KEY: 'f07d6c72ff341a4c4a9fbc3c2c2845ae-us9',
  MANDRILL_KEY: 'b9o9TRJaZIzZ0hG_lxNjKA',
  FB_APP_ID: process.env.NODE_ENV === 'production' ? '1589098114709228' : '1611274339158272',
  FB_APP_SECRET: process.env.NODE_ENV === 'production' ? '7fc1cf34eb3fe7daa129331790276b8b' : 'ed235dfc8b434a68ddf7bdf112990c75',
  AWS: {
    accessKeyId: 'AKIAIATRZOG65BYVOFOQ',
    secretAccessKey: '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',
    region: 'us-west-2'
  },
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
