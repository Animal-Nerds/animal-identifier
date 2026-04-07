import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: 'list',
	use: {
		// Dedicated port so E2E does not reuse a stale `npm run dev` on 5173.
		baseURL: 'http://127.0.0.1:4173',
		trace: 'on-first-retry'
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] }
		}
	],
	webServer: {
		// Skip `predev` Docker check; E2E assumes Postgres is reachable via DATABASE_URL.
		// Bind explicitly to IPv4 so the readiness check matches `baseURL`.
		command: 'npx vite dev --host 127.0.0.1 --port 4173',
		url: 'http://127.0.0.1:4173/',
		// Reuse avoids failures when port 5173 is already taken (e.g. `npm run dev`).
		// Set PLAYWRIGHT_FORCE_SERVER=1 to always spawn a fresh server (e.g. strict CI).
		reuseExistingServer: process.env.PLAYWRIGHT_FORCE_SERVER !== '1',
		timeout: 180_000,
		stdout: 'pipe',
		stderr: 'pipe'
	}
});
