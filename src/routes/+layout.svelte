<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import Header from '$lib/components/Header.svelte';
	import { auth } from '$lib/stores/auth';

	let { children } = $props();

	const PUBLIC_ROUTES = ['/', '/login', '/signup'];

	// Check if current route requires authentication
	function isProtectedRoute(pathname: string): boolean {
		return !PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
	}

	// Redirect effect: if trying to access protected route while not authenticated
	$effect(() => {
		if (browser && isProtectedRoute($page.url.pathname) && !$auth.isAuthenticated) {
			goto('/login');
		}
	});
</script>

<svelte:head>
	<title>Animal Identifier</title>
</svelte:head>

<div class="app-container">
	<Header />
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
