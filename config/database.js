module.exports = 
  { "development":
    { "driver":   "mysql"
    , "host":     "localhost"
    , "post":     3306
    , "database": "poems_db"
    , "username": "poems"
    , "password": "poems"
  }
  , "test":
    { "driver":   "memory"
    }
  , "production":
    { "driver":   "memory"
    }
  };
