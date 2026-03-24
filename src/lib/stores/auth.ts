import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { UserProfile } from '$lib/db/schema';

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

function profileToClientUser(profile: UserProfile): User {
	return {
		id: profile.id,
		email: profile.email,
		username: profile.email.split('@')[0] || 'user',
		createdAt: new Date().toISOString()
	};
}

function loadFromStorage(): AuthState {
	if (!browser) return defaultState;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) return JSON.parse(stored) as AuthState;
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
		/** Sync from server session (httpOnly cookie → layout data). Still mirrors to localStorage via subscribe. */
		restore(user: UserProfile | null) {
			set({
				isAuthenticated: !!user,
				userEmail: user?.email ?? null,
				user: user ? profileToClientUser(user) : null
			});
		},
		/** Mock / dev login: persists full AuthState JSON to localStorage (not a raw token string). */
		login(input: string | User) {
			const email = typeof input === 'string' ? input : input.email;
			const user =
				typeof input === 'string'
					? {
							id: 'mock',
							email,
							username: email.split('@')[0] || 'user',
							createdAt: new Date().toISOString()
						}
					: input;
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
