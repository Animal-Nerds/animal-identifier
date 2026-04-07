import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ fetch }) => {
	try {
		const res = await fetch('/api/auth/me');
		if (res.ok) {
			const data = await res.json();
			return { user: data.user ?? null };
		}
	} catch {
		// Offline or server unreachable — fall back to null.
		// The auth store will use its localStorage-backed state instead.
	}
	return { user: null };
};
