import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({
	connectionString
});

export const db = drizzle(pool);

