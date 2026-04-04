import { expect, test } from '@playwright/test';

/** Must satisfy `validatePassword` (upper, lower, digit, special @$!%*?&, min 8). */
const PASSWORD = 'Test1!aB';

test.describe.serial('account and sightings', () => {
	const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 10)}@example.com`;
	const species = 'E2E Bird';
	const speciesUpdated = 'E2E Bird Updated';

	test('signup creates account and lands on dashboard', async ({ page }) => {
		await page.goto('/signup');
		await page.getByLabel('Email').fill(email);
		await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
		await page.getByLabel('Confirm Password').fill(PASSWORD);
		await page.getByRole('button', { name: 'Sign Up' }).click();
		await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
		await expect(page.getByRole('heading', { name: 'My Sightings' })).toBeVisible();
	});

	test('login after sign out', async ({ page }) => {
		await page.goto('/signout');
		await expect(page.getByRole('heading', { name: 'You are logged out' })).toBeVisible({
			timeout: 15_000
		});

		await page.goto('/login');
		await page.getByLabel('Email').fill(email);
		await page.getByLabel('Password').fill(PASSWORD);
		await page.getByRole('button', { name: 'Log In' }).click();
		await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
		await expect(page.getByRole('heading', { name: 'My Sightings' })).toBeVisible();
	});

	test('create sighting from dashboard flow', async ({ page }) => {
		await page.goto('/login');
		await page.getByLabel('Email').fill(email);
		await page.getByLabel('Password').fill(PASSWORD);
		await page.getByRole('button', { name: 'Log In' }).click();
		await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });

		await page.getByRole('link', { name: '+ New Sighting' }).click();
		await expect(page.getByRole('heading', { name: 'New Sighting' })).toBeVisible();

		await page.getByLabel('Species').fill(species);
		await page.getByRole('button', { name: 'Create Sighting' }).click();

		await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
		await expect(page.getByRole('heading', { name: species, level: 3 })).toBeVisible({
			timeout: 30_000
		});
	});

	test('edit sighting', async ({ page }) => {
		await page.goto('/login');
		await page.getByLabel('Email').fill(email);
		await page.getByLabel('Password').fill(PASSWORD);
		await page.getByRole('button', { name: 'Log In' }).click();
		await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });

		await page.getByRole('link', { name: 'Edit' }).first().click();
		await expect(page).toHaveURL(/\/sighting\/[^/]+\/edit/, { timeout: 15_000 });
		await expect(page.getByRole('heading', { name: 'Edit Sighting' })).toBeVisible();

		await page.getByLabel('Species').fill(speciesUpdated);
		await page.getByRole('button', { name: 'Update Sighting' }).click();

		await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
		await expect(page.getByRole('heading', { name: speciesUpdated, level: 3 })).toBeVisible({
			timeout: 30_000
		});
	});

	test('delete sighting', async ({ page }) => {
		page.on('dialog', (d) => d.accept());

		await page.goto('/login');
		await page.getByLabel('Email').fill(email);
		await page.getByLabel('Password').fill(PASSWORD);
		await page.getByRole('button', { name: 'Log In' }).click();
		await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });

		await page.getByRole('button', { name: 'Delete sighting' }).first().click();

		await expect(page.getByRole('heading', { name: 'No sightings yet' })).toBeVisible({
			timeout: 30_000
		});
	});
});
