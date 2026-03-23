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
		restore: (user: import('$lib/db/schema').UserProfile | null) => {
			// Keep client-only storage behavior for existing mock flows.
			if (typeof window !== 'undefined') {
				if (user) {
					localStorage.setItem(STORAGE_KEY, 'server_session_' + user.id);
				} else {
					localStorage.removeItem(STORAGE_KEY);
				}
			}

			set({
				isAuthenticated: !!user,
				userEmail: user?.email ?? null
			});
		},
		login: (email: string) => {
			const token = 'mock_token_' + Date.now();
			localStorage.setItem(STORAGE_KEY, token);
			document.cookie = `${STORAGE_KEY}=${token}; path=/;`;
			set({
				isAuthenticated: true,
				userEmail: email
			});
		},
		logout: () => {
			localStorage.removeItem(STORAGE_KEY);
			document.cookie = `${STORAGE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
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
