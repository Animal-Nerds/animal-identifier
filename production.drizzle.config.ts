import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const connectionString = process.env.PRODUCTION_DATABASE_URL;

if (!connectionString) {
	throw new Error('PRODUCTION_DATABASE_URL is not set');
}

export default defineConfig({
	schema: './src/lib/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: {
		url: connectionString + '?sslmode=verify-full'
	}
});

