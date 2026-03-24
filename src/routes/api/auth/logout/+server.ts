import { json } from '@sveltejs/kit';
import { deleteSession } from '$lib/server/auth';
import { SESSION } from '$lib/utils/constants';

export const POST = async ({ cookies, url }) => {
	const token = cookies.get(SESSION.COOKIE_NAME);

	try {
		if (token) {
			await deleteSession(token);
		}
	} catch {
		// Logout must be graceful even if DB/session is already missing.
	}

	cookies.delete(SESSION.COOKIE_NAME, {
		path: '/',
		httpOnly: true,
		secure: url.protocol === 'https:',
		sameSite: 'strict'
	});

	return json({ success: true }, { status: 200 });
};

