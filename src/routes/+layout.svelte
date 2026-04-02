<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Header from '$lib/components/Header.svelte';
	import { auth } from '$lib/stores/auth';
	import { onMount } from 'svelte';

	let { data, children } = $props();

	const PUBLIC_ROUTES = ['/', '/login', '/signup'];

	// Check if current route requires authentication
	function isProtectedRoute(pathname: string): boolean {
		return !PUBLIC_ROUTES.some((route) => {
			// '/' is a full match, otherwise every route would be public.
			if (route === '/') return pathname === '/';
			return pathname.startsWith(route);
		});
	}

	// Redirect effect: if trying to access protected route while not authenticated
	$effect(() => {
		// Hydrate store from server-side session data (httpOnly cookie -> locals.user -> layout data.user).
		auth.restore(data.user ?? null);

		if (browser && isProtectedRoute($page.url.pathname) && !$auth.isAuthenticated) {
			goto('/login');
		}
	});

	onMount(() => {
		if (!('serviceWorker' in navigator)) return;

		void navigator.serviceWorker.register('/service-worker.js');
	});
</script>

<svelte:head>
	<title>Animal Identifier</title>
</svelte:head>

<div class="app-container">
	<Header user={data.user} />
	<main class="app-main">
		{@render children()}
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
		background: #f5f5f5;
		color: #1f2a1f;
		-webkit-font-smoothing: antialiased;
		-webkit-text-size-adjust: 100%;
		overflow: hidden;
	}

	:global(html) {
		height: 100%;
		width: 100%;
	}

	.app-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
	}

	.app-main {
		flex: 1;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		padding: 1rem;
		padding-bottom: 2rem;
	}

	@supports (padding: max(0px)) {
		.app-main {
			padding-bottom: max(1rem, env(safe-area-inset-bottom));
		}
	}
</style>
