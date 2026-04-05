import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '$lib/db/schema';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });

export const db = drizzle(pool, { schema });

