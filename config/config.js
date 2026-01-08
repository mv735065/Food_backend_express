require('dotenv').config();

const config = {
  // Server Configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // API Configuration
  apiPrefix: '/api',

  // CORS Configuration (if needed)
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },

  // PostgreSQL Configuration
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB || 'foodapp',
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || '',
    ssl: process.env.POSTGRES_SSL === 'true' || false,
    url: process.env.DATABASE_URL || null,
  },

  // MongoDB Configuration
  mongodb: {
    // ✅ Use the variable you actually set in your .env
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/foodapp_notifications',
  },

  // JWT Secret
  jwtSecret: process.env.JWT_SECRET || 'supersecret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

module.exports = config;
