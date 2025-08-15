
import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Base configuration
const poolConfig: PoolConfig = {
    connectionString: process.env.DATABASE_URL,
};

// For production environments like Render, PostgreSQL requires SSL.
// Render injects a RENDER environment variable that we can check for.
if (process.env.RENDER) {
    poolConfig.ssl = {
        rejectUnauthorized: false,
    };
}

export const pool = new Pool(poolConfig);

pool.on('connect', (client) => {
    console.log('Database client connected');
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    (process as any).exit(-1);
});

export default {
    query: (text: string, params?: any[]) => pool.query(text, params),
};
