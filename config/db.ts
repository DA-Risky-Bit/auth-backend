// db.js
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host:                    process.env.PGHOST ?? 'localhost',
  port:                    Number(process.env.PGPORT ?? 5432),
  user:                    process.env.PGUSER,
  password:                process.env.PGPASSWORD,
  database:                process.env.PGDATABASE,
  max:                     20,
  idleTimeoutMillis:       30000,
  connectionTimeoutMillis: 2000,
  maxLifetimeSeconds:      60,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export default pool;
