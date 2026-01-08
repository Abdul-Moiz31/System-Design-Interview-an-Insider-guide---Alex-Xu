import { pool } from '../db/pool.js';

export interface UrlRecord {
  id: number;
  short_code: string;
  original_url: string;
  created_at: Date;
  expires_at: Date | null;
  click_count: number;
}

export interface CreateUrlParams {
  shortCode: string;
  originalUrl: string;
  expiresAt?: Date;
}

export const urlRepository = {
  /**
   * Create a new URL mapping
   */
  async create(params: CreateUrlParams): Promise<UrlRecord> {
    const { shortCode, originalUrl, expiresAt } = params;
    
    const result = await pool.query<UrlRecord>(
      `INSERT INTO urls (short_code, original_url, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [shortCode, originalUrl, expiresAt || null]
    );
    
    return result.rows[0];
  },

  /**
   * Find URL by short code
   */
  async findByShortCode(shortCode: string): Promise<UrlRecord | null> {
    const result = await pool.query<UrlRecord>(
      `SELECT * FROM urls WHERE short_code = $1`,
      [shortCode]
    );
    
    return result.rows[0] || null;
  },

  /**
   * Find URL by original URL (for deduplication)
   */
  async findByOriginalUrl(originalUrl: string): Promise<UrlRecord | null> {
    const result = await pool.query<UrlRecord>(
      `SELECT * FROM urls 
       WHERE original_url = $1 
       AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY created_at DESC
       LIMIT 1`,
      [originalUrl]
    );
    
    return result.rows[0] || null;
  },

  /**
   * Check if short code exists
   */
  async shortCodeExists(shortCode: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT 1 FROM urls WHERE short_code = $1`,
      [shortCode]
    );
    
    return result.rowCount !== null && result.rowCount > 0;
  },

  /**
   * Increment click count
   */
  async incrementClickCount(shortCode: string): Promise<void> {
    await pool.query(
      `UPDATE urls SET click_count = click_count + 1 WHERE short_code = $1`,
      [shortCode]
    );
  },

  /**
   * Delete expired URLs
   */
  async deleteExpired(): Promise<number> {
    const result = await pool.query(
      `DELETE FROM urls WHERE expires_at IS NOT NULL AND expires_at < NOW()`
    );
    
    return result.rowCount || 0;
  },

  /**
   * Get URL statistics
   */
  async getStats(shortCode: string): Promise<UrlRecord | null> {
    return this.findByShortCode(shortCode);
  },
};

