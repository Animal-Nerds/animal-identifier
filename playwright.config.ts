import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	testDir: 'e2e',
	globalSetup: path.join(root, 'e2e/global-setup.ts'),
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
		// Build then preview so the service worker is active for offline E2E tests.
		command: 'npx vite build && npx vite preview --host 127.0.0.1 --port 4173',
		url: 'http://127.0.0.1:4173/',
		reuseExistingServer: process.env.PLAYWRIGHT_FORCE_SERVER !== '1',
		timeout: 180_000,
		stdout: 'pipe',
		stderr: 'pipe'
	}
});
