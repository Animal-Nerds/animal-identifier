import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	server: {
		allowedHosts: true
	},
	plugins: [tailwindcss(), sveltekit()],
	test: {
		// Playwright specs live in e2e/ and must not run under Vitest (CI: npm test).
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: ['node_modules', 'e2e', '.svelte-kit', 'build']
	}
});
