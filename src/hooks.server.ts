import type { Handle } from '@sveltejs/kit';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '$lib/server/db/client';
import { sessions, users } from '$lib/db/schema';

const SESSION_COOKIE_NAME = 'session';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE_NAME);

	if (!token) {
		event.locals.user = null;
		return resolve(event);
	}

	try {
		const now = new Date();
		const rows = await db
			.select({ user: users })
			.from(sessions)
			.innerJoin(users, eq(sessions.userId, users.id))
			.where(and(eq(sessions.token, token), gt(sessions.expiresAt, now)))
			.limit(1);

		event.locals.user = rows[0]?.user ?? null;
	} catch {
		event.locals.user = null;
	}

	return resolve(event);
};

