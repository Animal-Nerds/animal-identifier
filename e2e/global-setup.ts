import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';
import { Client } from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(root, '.env') });
dotenv.config({ path: path.join(root, '.env.local'), override: true });

function tryStartDocker(): void {
	if (process.env.E2E_SKIP_DOCKER === '1') {
		console.log('[e2e setup] E2E_SKIP_DOCKER=1 — not starting Docker.');
		return;
	}
	try {
		execSync('docker compose version', { cwd: root, stdio: 'pipe' });
	} catch {
		console.warn('[e2e setup] Docker Compose not available; assuming Postgres is already running.');
		return;
	}
	try {
		console.log('[e2e setup] docker compose up -d');
		execSync('docker compose up -d', { cwd: root, stdio: 'inherit' });
	} catch {
		console.warn('[e2e setup] docker compose up -d failed (is Docker Desktop running?). Continuing if DB is reachable.');
	}
}

async function waitForPostgres(maxAttempts = 90, delayMs = 1000): Promise<void> {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		throw new Error(
			'DATABASE_URL is missing. Copy .env.example to .env and run docker compose up -d (or set E2E_SKIP_DOCKER=1 if Postgres is already up).'
		);
	}

	for (let i = 0; i < maxAttempts; i++) {
		const client = new Client({ connectionString });
		try {
			await client.connect();
			await client.query('select 1');
			await client.end();
			console.log('[e2e setup] Postgres is reachable.');
			return;
		} catch {
			try {
				await client.end();
			} catch {
				/* ignore */
			}
			if (i === maxAttempts - 1) {
				throw new Error(
					`Postgres not reachable after ${maxAttempts}s (${connectionString.replace(/:[^:@/]+@/, ':****@')}). Start Docker and run: docker compose up -d`
				);
			}
			if (i === 0 || (i + 1) % 10 === 0) {
				console.log(`[e2e setup] Waiting for Postgres… (${i + 1}/${maxAttempts})`);
			}
			await new Promise((r) => setTimeout(r, delayMs));
		}
	}
}

function pushSchema(): void {
	console.log('[e2e setup] drizzle-kit push --force');
	execSync('npx drizzle-kit push --config ./drizzle.config.ts --force', {
		cwd: root,
		stdio: 'inherit',
		env: process.env
	});
}

export default async function globalSetup(): Promise<void> {
	tryStartDocker();
	await waitForPostgres();
	pushSchema();
}
