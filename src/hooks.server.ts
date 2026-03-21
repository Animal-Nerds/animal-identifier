import type { Handle } from '@sveltejs/kit';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '$lib/db/client';
import { sessions, users } from '$lib/db/schema';

export const handle: Handle = async ({ event, resolve }) => {
    const token = event.cookies.get('auth_token');

    event.locals.token = undefined;
    event.locals.user = undefined;

    if (token) {
        const [row] = await db
            .select({
                token: sessions.token,
                userId: users.id,
                emial: users.email,
            })
            .from(sessions)
            .innerJoin(users, eq(users.id, sessions.userId))
            .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
            .limit(1);
            
        if (row) {
            event.locals.token = row.token;
            event.locals.user = {
                id: row.userId,
                email: row.emial,
            };
        } else {
            event.cookies.delete('auth_token', {path: '/'});
        }
    }
    return resolve(event);
};
