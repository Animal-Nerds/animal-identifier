import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'auth';

interface AuthState {
	isAuthenticated: boolean;
	userEmail: string | null;
	user: User | null;
}

const defaultState: AuthState = {
	isAuthenticated: false,
	userEmail: null,
	user: null
};

function loadFromStorage(): AuthState {
	if (!browser) return defaultState;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) return JSON.parse(stored);
	} catch {
		// ignore corrupt data
	}
	return defaultState;
}

function createAuthStore() {
	const { subscribe, set } = writable<AuthState>(loadFromStorage());

	if (browser) {
		subscribe((state) => {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		});
	}

	return {
		subscribe,
		login(input: string | User) {
			const user = typeof input === 'string' ? null : input;
			const email = typeof input === 'string' ? input : input.email;
			set({
				isAuthenticated: true,
				userEmail: email,
				user
			});
		},
		logout() {
			set(defaultState);
			if (browser) localStorage.removeItem(STORAGE_KEY);
		},
		hydrate(user: User) {
			set({
				isAuthenticated: true,
				userEmail: user.email,
				user
			});
		}
	};
}

export const auth = createAuthStore();
