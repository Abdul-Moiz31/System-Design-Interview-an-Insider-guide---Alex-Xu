import { pool } from './pool.js';

const migrations = `
-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT users_email_idx UNIQUE (email)
);

-- URLs table for storing URL mappings
CREATE TABLE IF NOT EXISTS urls (
  id SERIAL PRIMARY KEY,
  short_code VARCHAR(10) UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  click_count INTEGER DEFAULT 0,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  
  -- Index for fast lookups by short_code
  CONSTRAINT urls_short_code_idx UNIQUE (short_code)
);

-- Index for checking duplicate original URLs
CREATE INDEX IF NOT EXISTS urls_original_url_idx ON urls (original_url);

-- Index for finding expired URLs
CREATE INDEX IF NOT EXISTS urls_expires_at_idx ON urls (expires_at) WHERE expires_at IS NOT NULL;

-- Index for user's URLs
CREATE INDEX IF NOT EXISTS urls_user_id_idx ON urls (user_id);
`;

async function migrate() {
  console.log('Running database migrations...');
  
  try {
    await pool.query(migrations);
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();

