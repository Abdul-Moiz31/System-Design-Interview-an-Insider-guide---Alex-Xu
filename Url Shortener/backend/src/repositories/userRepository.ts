import { Pool } from 'pg';
import { pool } from '../db/pool.js';

export interface UserRecord {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  created_at: Date;
}

export interface CreateUserParams {
  email: string;
  name: string;
  passwordHash: string;
}

export const userRepository = {
  /**
   * Create a new user
   */
  async create(params: CreateUserParams): Promise<Omit<UserRecord, 'password_hash'>> {
    const { email, name, passwordHash } = params;
    
    const result = await pool.query<UserRecord>(
      `INSERT INTO users (email, name, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, created_at`,
      [email, name, passwordHash]
    );
    
    return result.rows[0];
  },

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await pool.query<UserRecord>(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    
    return result.rows[0] || null;
  },

  /**
   * Find user by ID
   */
  async findById(id: number): Promise<Omit<UserRecord, 'password_hash'> | null> {
    const result = await pool.query<UserRecord>(
      `SELECT id, email, name, created_at FROM users WHERE id = $1`,
      [id]
    );
    
    return result.rows[0] || null;
  },

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT 1 FROM users WHERE email = $1`,
      [email]
    );
    
    return result.rowCount !== null && result.rowCount > 0;
  },
};

