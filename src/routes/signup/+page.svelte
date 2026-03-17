<script lang="ts">
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');

	let errors = $state({
		email: '',
		password: '',
		confirmPassword: '',
		server: ''
	});

	let loading = $state(false);

	const isValidEmail = (value: string): boolean => {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
	};

	const validate = () => {
		errors.email = '';
		errors.password = '';
		errors.confirmPassword = '';
		errors.server = '';

		let valid = true;

		if (!email) {
			errors.email = 'Email is required';
			valid = false;
		} else if (!isValidEmail(email)) {
			errors.email = 'Enter a valid email address';
			valid = false;
		}

		if (!password) {
			errors.password = 'Password is required';
			valid = false;
		} else if (password.length < 8) {
			errors.password = 'Password must be at least 8 characters';
			valid = false;
		}

		if (!confirmPassword) {
			errors.confirmPassword = 'Please confirm your password';
			valid = false;
		} else if (confirmPassword !== password) {
			errors.confirmPassword = 'Passwords do not match';
			valid = false;
		}

		return valid;
	};

	const handleSubmit = async (e: SubmitEvent) => {
		e.preventDefault();

		if (!validate()) return;

		loading = true;
		errors.server = '';

		try {
			const res = await fetch('/api/auth/signup', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email, password })
			});

			const data = await res.json();

			if (!res.ok) {
				errors.server = data?.message || 'Signup failed';
				return;
			}

			// success
			goto('/dashboard');
		} catch (err: unknown) {
			errors.server = 'Something went wrong. Please try again.';
		} finally {
			loading = false;
		}
	};
</script>

<svelte:head>
	<title>Sign Up</title>
</svelte:head>

<div class="container">
	<h1>Create an account</h1>

	<form on:submit={handleSubmit} novalidate aria-describedby="form-error">
		<div class="field">
			<label for="email">Email</label>
			<input
				id="email"
				type="email"
				bind:value={email}
				required
				aria-invalid={!!errors.email}
				aria-describedby="email-error"
			/>
			{#if errors.email}
				<p id="email-error" class="error">{errors.email}</p>
			{/if}
		</div>

		<div class="field">
			<label for="password">Password</label>
			<input
				id="password"
				type="password"
				bind:value={password}
				required
				minlength="8"
				aria-invalid={!!errors.password}
				aria-describedby="password-error"
			/>
			{#if errors.password}
				<p id="password-error" class="error">{errors.password}</p>
			{/if}
		</div>

		<div class="field">
			<label for="confirmPassword">Confirm Password</label>
			<input
				id="confirmPassword"
				type="password"
				bind:value={confirmPassword}
				required
				aria-invalid={!!errors.confirmPassword}
				aria-describedby="confirm-error"
			/>
			{#if errors.confirmPassword}
				<p id="confirm-error" class="error">{errors.confirmPassword}</p>
			{/if}
		</div>

		{#if errors.server}
			<p id="form-error" class="error server">{errors.server}</p>
		{/if}

		<button type="submit" disabled={loading} aria-busy={loading}>
			{loading ? 'Creating account...' : 'Sign Up'}
		</button>
	</form>

	<p class="login-link">
		Already have an account?
		<a href="/auth/login">Log in</a>
	</p>
</div>

<style>
	.container {
		max-width: 400px;
		margin: 2rem auto;
		padding: 1rem;
	}

	h1 {
		margin-bottom: 1.5rem;
	}

	.field {
		margin-bottom: 1rem;
		display: flex;
		flex-direction: column;
	}

	label {
		margin-bottom: 0.25rem;
		font-weight: 500;
	}

	input {
		padding: 0.5rem;
		font-size: 1rem;
	}

	button {
		width: 100%;
		padding: 0.75rem;
		margin-top: 1rem;
		cursor: pointer;
	}

	.error {
		color: red;
		font-size: 0.875rem;
	}

	.server {
		margin-top: 0.5rem;
	}

	.login-link {
		margin-top: 1rem;
		text-align: center;
	}
</style>
