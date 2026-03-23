import type { Handle } from '@sveltejs/kit';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '$lib/server/db/client';
import { sessions, users } from '$lib/db/schema';
import { SESSION } from '$lib/utils/constants';

export const handle: Handle = async ({ event, resolve }) => {
	// Default for every request (no redirects here).
	event.locals.user = null;
	event.locals.token = undefined;

	const token = event.cookies.get(SESSION.COOKIE_NAME);
	if (!token) {
		return resolve(event);
	}

	try {
		const now = new Date();
		const rows = await db
			.select({
				id: users.id,
				email: users.email
			})
			.from(sessions)
			.innerJoin(users, eq(sessions.userId, users.id))
			.where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
			.limit(1);

		if (rows.length > 0) {
			event.locals.user = rows[0];
			event.locals.token = token;
		}
	} catch {
		// Invalid DB/session state should never crash request handling.
		event.locals.user = null;
		event.locals.token = undefined;
	}

	return resolve(event);
};
