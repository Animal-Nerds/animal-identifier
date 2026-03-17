<script lang="ts">
	import { goto } from '$app/navigation';
	import { BASE_PATH, API_ROUTES } from '$lib/utils/constants';

	let name = '';
	let email = '';
	let password = '';
	let isSubmitting = false;
	let fieldErrors: string[] = [];
	let generalError: string | null = null;

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		isSubmitting = true;
		fieldErrors = [];
		generalError = null;

		try {
			const res = await fetch(`${BASE_PATH}${API_ROUTES.AUTH.SIGNUP}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name, email, password })
			});

			if (res.status === 400) {
				const data = await res.json();
				fieldErrors = data.errors ?? ['Invalid signup data'];
				return;
			}

			if (res.status === 409) {
				const data = await res.json();
				generalError = data.error ?? 'Email address is already registered';
				return;
			}

			if (!res.ok) {
				const data = await res.json().catch(() => null);
				generalError = data?.error ?? 'Unexpected error during signup';
				return;
			}

			await res.json();
			goto('/login');
		} catch (err) {
			console.error(err);
			generalError = 'Network error. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Sign Up - Animal Identifier</title>
</svelte:head>

<div class="auth-container">
	<form class="auth-card" onsubmit={handleSubmit}>
		<h2>Create your account</h2>
		<p class="subtitle">Start tracking your wildlife sightings</p>

		{#if generalError}
			<div class="alert">{generalError}</div>
		{/if}

		{#if fieldErrors.length}
			<ul class="error-list">
				{#each fieldErrors as error}
					<li>{error}</li>
				{/each}
			</ul>
		{/if}

		<label>
			<span>Full name</span>
			<input
				type="text"
				bind:value={name}
				placeholder="Jane Doe"
				autocomplete="name"
				required
			/>
		</label>

		<label>
			<span>Email</span>
			<input
				type="email"
				bind:value={email}
				placeholder="you@example.com"
				autocomplete="email"
				required
			/>
		</label>

		<label>
			<span>Password</span>
			<input
				type="password"
				bind:value={password}
				placeholder="At least 8 characters"
				autocomplete="new-password"
				required
			/>
			<p class="hint">
				Must contain uppercase, lowercase, number and special character.
			</p>
		</label>

		<button class="submit-btn" type="submit" disabled={isSubmitting}>
			{#if isSubmitting}
				Creating account...
			{:else}
				Create account
			{/if}
		</button>

		<p class="switch-link">
			Already have an account?
			<a href="/login">Sign in</a>
		</p>
	</form>
</div>

<style>
	.auth-container {
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
		max-width: 380px;
		width: 100%;
	}

	h2 {
		margin: 0 0 0.25rem;
		font-size: 1.5rem;
	}

	.subtitle {
		margin: 0 0 1.5rem;
		color: #666;
		font-size: 0.95rem;
	}

	label {
		display: block;
		margin-bottom: 1rem;
	}

	label span {
		display: block;
		margin-bottom: 0.35rem;
		font-size: 0.9rem;
		font-weight: 500;
	}

	input {
		width: 100%;
		padding: 0.7rem 0.8rem;
		border-radius: 0.5rem;
		border: 1px solid #d1d5db;
		font-size: 0.95rem;
		outline: none;
		box-sizing: border-box;
	}

	input:focus-visible {
		border-color: #2563eb;
		box-shadow: 0 0 0 1px #2563eb33;
	}

	.hint {
		margin: 0.25rem 0 0;
		font-size: 0.8rem;
		color: #6b7280;
	}

	.submit-btn {
		width: 100%;
		margin-top: 0.5rem;
		padding: 0.85rem 1rem;
		border-radius: 0.7rem;
		border: none;
		background: #2d5a2d;
		color: white;
		font-weight: 600;
		font-size: 0.95rem;
		cursor: pointer;
	}

	.submit-btn:disabled {
		opacity: 0.7;
		cursor: default;
	}

	.alert {
		background: #fef2f2;
		color: #991b1b;
		border-radius: 0.5rem;
		padding: 0.75rem 0.9rem;
		font-size: 0.85rem;
		margin-bottom: 0.75rem;
	}

	.error-list {
		margin: 0 0 0.75rem;
		padding-left: 1.1rem;
		color: #b91c1c;
		font-size: 0.85rem;
	}

	.switch-link {
		margin-top: 1.25rem;
		font-size: 0.9rem;
		color: #4b5563;
		text-align: center;
	}

	.switch-link a {
		color: #2563eb;
		text-decoration: none;
		font-weight: 500;
	}
</style>

