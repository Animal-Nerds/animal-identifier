<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { validateEmail, validatePassword } from '$lib/utils/validation';
	import { BASE_PATH, API_ROUTES, VALIDATION } from '$lib/utils/constants';
	import { auth } from '$lib/stores/auth';

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

	const validate = () => {
		errors.email = '';
		errors.password = '';
		errors.confirmPassword = '';
		errors.server = '';

		let valid = true;

		if (!email) {
			errors.email = 'Email is required';
			valid = false;
		} else {
			const emailResult = validateEmail(email);
			if (!emailResult.valid) {
				errors.email = emailResult.errors.join(', ');
				valid = false;
			}
		}

		if (!password) {
			errors.password = 'Password is required';
			valid = false;
		} else {
			const passwordResult = validatePassword(password);
			if (!passwordResult.valid) {
				errors.password = `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters with uppercase, lowercase, digit, and special character`;
				valid = false;
			}
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
			const res = await fetch(BASE_PATH + API_ROUTES.AUTH.SIGNUP, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email, password }),
				credentials: 'include'
			});

			const data = await res.json().catch(() => ({}));

			if (!res.ok) {
				if (Array.isArray(data?.errors) && data.errors.length > 0) {
					errors.server = data.errors.join(', ');
				} else {
					errors.server = data?.error ?? 'Signup failed';
				}
				return;
			}

			auth.hydrate({
				id: data.user.id,
				email: data.user.email,
				username: data.user.email.split('@')[0] || 'user',
				createdAt: new Date().toISOString()
			});
			await invalidateAll();
			goto('/dashboard');
		} catch {
			errors.server = 'Something went wrong. Please try again.';
		} finally {
			loading = false;
		}
	};
</script>

<svelte:head>
	<title>Sign Up</title>
</svelte:head>

<div class="auth-page">
	<div class="welcome-card auth-card">
		<h2>Create your account</h2>
		<p class="sub-msg">Join to save and share your wildlife sightings.</p>

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

			<button type="submit" class="btn btn-primary" disabled={loading} aria-busy={loading}>
				{loading ? 'Creating account...' : 'Sign Up'}
			</button>
		</form>

		<p class="login-link">
			Already have an account?
			<a href="/login">Log in</a>
		</p>
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

	form {
		text-align: left;
		margin-top: 0.5rem;
	}

	.field {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.4rem;
		font-weight: 600;
	}

	input {
		width: 100%;
		padding: 0.85rem 1rem;
		border-radius: 0.5rem;
		border: 1px solid rgba(0, 0, 0, 0.12);
		background: #f9fafb;
		box-sizing: border-box;
	}

	.error {
		margin: 0.4rem 0 0;
		color: #b42318;
		font-size: 0.9rem;
	}

	.error.server {
		text-align: center;
		margin-bottom: 1rem;
	}

	.btn {
		display: block;
		width: 100%;
		padding: 0.9rem 1.5rem;
		border-radius: 0.5rem;
		text-decoration: none;
		font-weight: 600;
		transition: opacity 0.2s;
		border: none;
	}

	.btn:active {
		opacity: 0.8;
	}

	.btn-primary {
		background: #2d5a2d;
		color: white;
	}

	.btn:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.login-link {
		margin-top: 1rem;
		color: #555;
		text-align: center;
		font-size: 0.95rem;
	}

	.login-link a {
		color: #2d5a2d;
		font-weight: 700;
		text-decoration: none;
	}

	.login-link a:hover {
		text-decoration: underline;
	}
</style>