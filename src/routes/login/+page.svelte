<script lang="ts">
	import { auth } from '$lib/stores/auth';
    import { validateEmail, validatePassword } from '$lib/utils/validation';
	import { goto } from '$app/navigation';

    let email = $state('');
    let password = $state('');
    let errors = $state<Record<string, string>>({});
    let serverError = $state<string | null>(null);
    let isLoading = $state(false);
    let isSubmitted = $state(false);

    function validateForm(): boolean {
        errors = {};

        if (!email.trim()) {
            errors.email = 'Email is required';
        } else {
            const emailValidation = validateEmail(email);
            if (!emailValidation.valid) {
                errors.email = emailValidation.errors[0] || 'Invalid email format';
            }
        }

        if (!password.trim()) {
            errors.password = 'Password is required';
        } else {
            const passwordValidation = validatePassword(password);
            if (!passwordValidation.valid) {
                errors.password = 'Invalid password format';
            }
        }

        return Object.keys(errors).length === 0;

    }

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        isSubmitted = true;
        serverError = null;

        if (!validateForm()) {
            return;
        }

        isLoading = true;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password: password.trim()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                serverError = data.message || 'Login failed';
                return;
            }   

            auth.login(email.trim());
            await goto('/dashboard');
        } catch (error) {
            serverError = 'An error occurred While logging in. Please try again.';
            console.error('Login error:', error);
        } finally {
            isLoading = false;
        }
    }
    function handleEmailBlur () {
        if (isSubmitted && email.trim()) {
            const validation = validateEmail(email);
            if (!validation.valid) {
                errors.email = validation.errors[0] || 'Invalid email format';
            } else {
                delete errors.email;
                errors = errors;
            }
        }
    }

    function handlePasswordBlur () {
        if (isSubmitted && password.trim()) {
            const validation = validatePassword(password);
            if (!validation.valid) {
                errors.password = 'Invalid password format';
            } else {
                delete errors.password;
                errors = errors;
            }
        }
    }
</script>

<svelte:head>
	<title>Login - Animal Identifier</title>
</svelte:head>

<div>
    <form onsubmit={handleSubmit} novalidate class="login-form">
        <h2>Login to Your Account</h2>
        <div>
            <label for="email" class="email-label">
            Email Address:
            <span class="invalid-red" aria-label="required">*</span>
        </label>
            <input
                id="email"
                type="email"
                bind:value={email}
                onblur={handleEmailBlur}
                disabled={isLoading}
                required
                aria-required="true"
                aria-describedby={errors.email ? 'email-error' : undefined}
                class="email-input"
                placeholder="email@example.com"
            />
            {#if errors.email}
                <div id="email-error" class="error-message">{errors.email}</div>
            {/if}
        </div>
        
        <div>
            <label for="password" class="password-label">
                Password:
                <span class="invalid-red" aria-label="required">*</span>
            </label>
            <input
                id="password"
                type="password"
                bind:value={password}
                onblur={handlePasswordBlur}
                disabled={isLoading}
                required
                aria-required="true"
                aria-describedby={errors.password ? 'password-error' : undefined}
                class="password-input"
                placeholder="Enter your password"
            />
            {#if errors.password}
                <div id="password-error" class="error-message">{errors.password}</div>
            {/if}
        </div>

        <button
            type="submit"
            disabled={isLoading}
            class="submit-button"
        >
            {#if isLoading}
                Signing In...
            {:else}
                Sign In
            {/if}
        </button>
    </form>

    <div class="signup-link">
        <p class="need-account">
            Don't have an account?
            <a href="/auth/signup" class="promote-link">Sign Up</a>
        </p>
    </div>
</div>

<style>
    .login-form {
        max-width: 400px;
        margin: 0 auto;
        padding: 2rem;
        border: 1px solid #ccc;
        border-radius: 8px;
        background-color: #fff;
    }

    .login-form h2 {
        text-align: center;
        margin-bottom: 1.5rem;
    }

    .email-label,
    .password-label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: bold;
    }

    .invalid-red {
        color: red;
    }

    .email-input,
    .password-input {
        width: 100%;
        padding: 0.5rem;
        margin-bottom: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
    }

    .error-message {
        color: red;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
    }

    .submit-button {
        width: 100%;
        padding: 0.75rem;
        background-color: #007BFF;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
    }

    .submit-button[disabled] {
        background-color: #6c757d;
        cursor: not-allowed;
    }

    .signup-link {
        text-align: center;
        margin-top: 1rem;
    }

    .need-account {
        font-size: 0.875rem;
    }

    .promote-link {
        color: #007BFF;
        text-decoration: none;
    }
    </style>