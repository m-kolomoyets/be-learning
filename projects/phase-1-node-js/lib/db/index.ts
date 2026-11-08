import dotenv from 'dotenv';
import { Pool } from 'pg';
import { DEFAULT_DB_PORT } from '../constants.ts';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || DEFAULT_DB_PORT + ''),
});

export const sql = (text: string, params?: any[]) => {
    return pool.query(text, params);
};

export default pool;
