import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  // Türkçe karakter desteği için UTF-8 encoding
  client_encoding: 'UTF8',
  connectionTimeoutMillis: 5000,
});

// Her bağlantıda UTF-8 encoding'i zorla
pool.on('connect', client => {
  client.query('SET CLIENT_ENCODING TO UTF8;');
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('Successfully connected db');
    // UTF-8 encoding doğrulaması
    const result = await client.query('SHOW client_encoding;');
    console.log('Database encoding:', result.rows[0].client_encoding);
    client.release();
  } catch (err) {
    console.error('Database connection error:', err);
  }
};

export default pool;
export { connectDB };
