<script lang="ts">
	import { auth } from '$lib/stores/auth';
</script>

<svelte:head>
	<title>Home - Animal Identifier</title>
</svelte:head>

<div class="home-container">
	{#if $auth.isAuthenticated}
		<div class="welcome-card">
			<h2>Welcome back!</h2>
			<p class="sub-msg">Ready to track some wildlife?</p>

			<div class="action-buttons">
				<a href="/dashboard" class="btn btn-primary">View Sightings</a>
				<a href="/sighting" class="btn btn-secondary">Report Sighting</a>
			</div>
		</div>
	{:else}
		<div class="welcome-card">
			<h2>Animal Identifier</h2>
			<p class="sub-msg">Track and share wildlife sightings in your area</p>

			<div class="action-buttons">
				<a href="/login" class="btn btn-primary">Sign In</a>
				<a href="/signup" class="btn btn-secondary">Create Account</a>
			</div>
		</div>
	{/if}
</div>

<style>
	.home-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100%;
	}

	.welcome-card {
        flex: 1;
		background: white;
		border-radius: 1rem;
		padding: 2rem 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		text-align: center;
		max-width: 350px;
		margin: 0 1rem;
	}

	h2 {
		margin: 0 0 0.5rem;
		font-size: 1.75rem;
	}

	.sub-msg {
		color: #666;
		font-size: 0.95rem;
		margin: 0.5rem 0 1.5rem;
	}

	.action-buttons {
		display: grid;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.btn {
		display: block;
		padding: 0.9rem 1.5rem;
		border-radius: 0.5rem;
		text-decoration: none;
		font-weight: 600;
		transition: opacity 0.2s;
	}

	.btn:active {
		opacity: 0.8;
	}

	.btn-primary {
		background: #2d5a2d;
		color: white;
	}

	.btn-secondary {
		background: #e8f5e9;
		color: #1f2a1f;
		border: 1px solid #c8e6c9;
	}

	p {
		margin: 0;
	}
</style>
