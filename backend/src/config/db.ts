
import { Pool, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool: Pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Example for SSL connection (common in production environments like Heroku, AWS RDS)
  // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
  (process as any).exit(1); // Standard Node.js call for error exit
});

export const query = async (text: string, params?: any[]): Promise<QueryResult<any>> => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  // console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
};

export default pool;