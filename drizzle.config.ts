import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error('DATABASE_URL is not set for Drizzle migrations');
}

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: connectionString
	}
});

