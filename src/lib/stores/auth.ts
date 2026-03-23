import { writable } from 'svelte/store';

export const user = writable<User | null>(null);

export function logout() {
	user.set(null);
}
export function login(input: User) {
	user.set(input);
}
export function hydrate(input: User) {
	user.set(input);
}
