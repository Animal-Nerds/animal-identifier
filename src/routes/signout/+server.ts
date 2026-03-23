import { redirect } from '@sveltejs/kit';
import { deleteSession } from '$lib/server/auth';
import { SESSION } from '$lib/utils/constants';

export const GET = async ({ cookies, url }) => {
	const token = cookies.get(SESSION.COOKIE_NAME);

	try {
		if (token) {
			await deleteSession(token);
		}
	} catch {
		// Signout must be graceful. We still clear the cookie below.
	}

	cookies.delete(SESSION.COOKIE_NAME, {
		path: '/',
		httpOnly: true,
		secure: url.protocol === 'https:',
		sameSite: 'strict'
	});

	throw redirect(303, '/logout');
};

