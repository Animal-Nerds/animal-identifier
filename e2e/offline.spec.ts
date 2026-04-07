import { expect, test } from '@playwright/test';

const PASSWORD = 'Test1!aB';

/**
 * Helper: visit a page so the service worker caches it, then wait for the SW
 * to be active.
 */
async function warmServiceWorker(page: import('@playwright/test').Page) {
	await page.goto('/');
	await page.waitForFunction(
		() =>
			navigator.serviceWorker
				?.getRegistration()
				.then((reg) => reg?.active?.state === 'activated'),
		{ timeout: 30_000 }
	).catch(() => {});
}

test.describe.serial('offline PWA behavior', () => {
	const email = `e2e-offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
	const species = 'Offline Hawk';

	test('signup and create a sighting', async ({ page }) => {
		await page.goto('/signup');
		await page.getByLabel('Email').fill(email);
		await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
		await page.getByLabel('Confirm Password').fill(PASSWORD);
		await page.getByRole('button', { name: 'Sign Up' }).click();
		await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });

		await page.getByRole('link', { name: '+ New Sighting' }).click();
		await expect(page.getByRole('heading', { name: 'New Sighting' })).toBeVisible();

		await page.getByLabel('Species').fill(species);
		await page.getByRole('button', { name: 'Create Sighting' }).click();

		await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
		await expect(page.getByRole('heading', { name: species, level: 2 })).toBeVisible({
			timeout: 30_000
		});
	});

	test('service worker serves cached login page offline', async ({ page, context }) => {
		// Warm the SW and cache the login page in THIS context
		await warmServiceWorker(page);
		await page.goto('/login');
		await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();

		// Go offline and reload — SW should serve from cache
		await context.setOffline(true);
		await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});

		await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible({
			timeout: 15_000
		});

		await context.setOffline(false);
	});

	test('sightings persist in IDB across online reload', async ({ page }) => {
		// Log in and see the sighting
		await page.goto('/login');
		await page.getByLabel('Email').fill(email);
		await page.getByLabel('Password').fill(PASSWORD);
		await page.getByRole('button', { name: 'Log In' }).click();
		await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
		await expect(page.getByRole('heading', { name: species, level: 2 })).toBeVisible({
			timeout: 30_000
		});

		// Reload — init() loads from IDB first, then syncs with server
		await page.reload();
		await expect(page.getByRole('heading', { name: species, level: 2 })).toBeVisible({
			timeout: 30_000
		});
	});

	test('sighting deleted offline is removed locally and syncs on reconnect', async ({
		page,
		context
	}) => {
		await page.goto('/login');
		await page.getByLabel('Email').fill(email);
		await page.getByLabel('Password').fill(PASSWORD);
		await page.getByRole('button', { name: 'Log In' }).click();
		await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
		await expect(page.getByRole('heading', { name: species, level: 2 })).toBeVisible({
			timeout: 30_000
		});

		// Go offline and delete
		await context.setOffline(true);
		page.on('dialog', (d) => d.accept());
		await page.getByRole('button', { name: 'Delete sighting' }).first().click();

		// Should vanish immediately (optimistic remove)
		await expect(page.getByRole('heading', { name: species, level: 2 })).not.toBeVisible({
			timeout: 5_000
		});

		// Reconnect and reload — delete should sync to server
		await context.setOffline(false);
		await page.reload();
		await expect(page.getByRole('heading', { name: 'My Sightings' })).toBeVisible({
			timeout: 30_000
		});
		// Sighting should still be gone after server sync
		await expect(page.getByRole('heading', { name: species, level: 2 })).not.toBeVisible({
			timeout: 5_000
		});
	});
});
