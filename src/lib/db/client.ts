import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const globalForDb = globalThis as unknown as {
    pool?: Pool;
    db?: ReturnType<typeof drizzle<typeof schema>>;
};

export const pool = globalForDb.pool || new Pool({
    connectionString,
});

export const db = globalForDb.db || drizzle(pool, { schema });

if (process.env.NODE_ENV !== 'production') {
    globalForDb.pool = pool;
    globalForDb.db = db;
}