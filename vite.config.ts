import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

/** @type {import('vite').UserConfig} */
export default defineConfig({
	server: {
		allowedHosts: true
	},
	plugins: [tailwindcss(), sveltekit()]
});
