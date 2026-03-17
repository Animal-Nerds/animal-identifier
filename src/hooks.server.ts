import type { Handle } from '@sveltejs/kit';
import { SESSION } from '$lib/utils/constants';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION.COOKIE_NAME);
	if (token) {
		event.locals.token = token;
	}
	return resolve(event);
};
