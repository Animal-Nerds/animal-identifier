import { writable } from 'svelte/store';

export interface AuthState {
	isAuthenticated: boolean;
	userEmail: string | null;
}

function createAuthStore() {
	const STORAGE_KEY = 'auth_token';

	// Initialize from localStorage if available
	let initialState: AuthState = {
		isAuthenticated: false,
		userEmail: null
	};

	if (typeof window !== 'undefined') {
		const token = localStorage.getItem(STORAGE_KEY);
		if (token) {
			initialState = {
				isAuthenticated: true,
				userEmail: 'user@example.com' // Mock email for now
			};
		}
	}

	const { subscribe, set, update } = writable<AuthState>(initialState);

	return {
		subscribe,
		login: (email: string) => {
			localStorage.setItem(STORAGE_KEY, 'mock_token_' + Date.now());
			set({
				isAuthenticated: true,
				userEmail: email
			});
		},
		logout: () => {
			localStorage.removeItem(STORAGE_KEY);
			set({
				isAuthenticated: false,
				userEmail: null
			});
		},
		isLoggedIn: (): boolean => {
			if (typeof window !== 'undefined') {
				return !!localStorage.getItem(STORAGE_KEY);
			}
			return false;
		}
	};
}

export const auth = createAuthStore();
