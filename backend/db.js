const { Pool } = require('pg');

const useSsl = process.env.DB_SSL === 'true';
let poolConfig;

if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  };
} else {
  poolConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  };
}

const pool = new Pool(poolConfig);

module.exports = pool;