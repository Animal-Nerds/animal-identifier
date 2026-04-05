import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const globalForDb = globalThis as unknown as {
    pool?: Pool;
    db?: ReturnType<typeof drizzle<typeof schema>>;
};

function getPool(): Pool {
    if (globalForDb.pool) return globalForDb.pool;

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL is not set');
    }

    const pool = new Pool({ connectionString });

    if (process.env.NODE_ENV !== 'production') {
        globalForDb.pool = pool;
    }

    return pool;
}

function getDb(): ReturnType<typeof drizzle<typeof schema>> {
    if (globalForDb.db) return globalForDb.db;

    const db = drizzle(getPool(), { schema });

    if (process.env.NODE_ENV !== 'production') {
        globalForDb.db = db;
    }

    return db;
}

export const pool = new Proxy({} as Pool, {
    get(_, prop) {
        return Reflect.get(getPool(), prop);
    }
});

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
    get(_, prop) {
        return Reflect.get(getDb(), prop);
    }
});
