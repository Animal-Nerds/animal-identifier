<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<svelte:head>
	<title>Logged out - Animal Identifier</title>
</svelte:head>

<div class="auth-page">
	<div class="welcome-card auth-card">
		<h2>You are logged out</h2>
		<p class="sub-msg">Your session has been invalidated.</p>

		<button class="btn btn-primary" onclick={() => goto('/')}>Go to home</button>
		<button class="btn" style="margin-top: 0.75rem; background: #e8f5e9; color: #1f2a1f; border: 1px solid #c8e6c9;" onclick={() => goto('/login')}>
			Go to login
		</button>
	</div>
</div>

<style>
	.auth-page {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100%;
	}

	.auth-card {
		background: white;
		border-radius: 1rem;
		padding: 2rem 1.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		text-align: center;
		max-width: 420px;
		margin: 0 1rem;
	}

	h2 {
		margin: 0 0 0.35rem;
		font-size: 1.75rem;
	}

	.sub-msg {
		color: #666;
		font-size: 0.95rem;
		margin: 0 0 1.25rem;
	}

	.btn {
		display: block;
		width: 100%;
		padding: 0.9rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		border: none;
		cursor: pointer;
	}

	.btn:active {
		opacity: 0.8;
	}

	.btn-primary {
		background: #2d5a2d;
		color: white;
	}
</style>

