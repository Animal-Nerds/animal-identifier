<script lang="ts">
	import { auth } from '$lib/stores/auth';
	import { goto } from '$app/navigation';

	function logout() {
		// Use server-side signout flow so DB + cookie are invalidated.
		goto('/signout');
	}
</script>

<svelte:head>
	<title>Dashboard - Animal Identifier</title>
</svelte:head>

<div>
	<h1>Dashboard</h1>

	{#if $auth.isAuthenticated}
		<p>Signed in as {$auth.userEmail}</p>
		<button onclick={logout}>Logout</button>
	{:else}
		<p>You are not signed in.</p>
		<a href="/login">Go to login</a>
	{/if}
</div>

