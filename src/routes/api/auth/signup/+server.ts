import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

import { db } from '$lib/db/client';
import { sessions, users } from '$lib/db/schema';
import { hashPassword, createSessionToken, getSessionExpiry } from '$lib/services/auth';
import { SESSION } from '$lib/utils/constants';
import { validateEmail, validatePassword, validateName } from '$lib/utils/validation';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body = await request.json().catch(() => null);

		const email = body?.email;
		const password = body?.password;
		const name = body?.name;

		const errors: string[] = [];

		const emailValidation = validateEmail(email);
		if (!emailValidation.valid) errors.push(...emailValidation.errors);

		const passwordValidation = validatePassword(password);
		if (!passwordValidation.valid) errors.push(...passwordValidation.errors);

		const nameValidation = validateName(name);
		if (!nameValidation.valid) errors.push(...nameValidation.errors);

		if (errors.length > 0) {
			return json({ errors }, { status: 400 });
		}

		// normalize email
		const normalizedEmail = String(email).toLowerCase();

		// check duplicate email
		const existing = await db.query.users.findFirst({
			where: eq(users.email, normalizedEmail)
		});

		if (existing) {
			return json({ error: 'Email address is already registered' }, { status: 409 });
		}

		const passwordHash = await hashPassword(password);
		const sessionToken = createSessionToken();
		const expiresAt = getSessionExpiry();

		const result = await db.transaction(async (tx) => {
			const [newUser] = await tx
				.insert(users)
				.values({
					email: normalizedEmail,
					name,
					passwordHash
				})
				.returning({
					id: users.id,
					email: users.email
				});

			await tx.insert(sessions).values({
				userId: newUser.id,
				token: sessionToken,
				expiresAt
			});

			return newUser;
		});

		cookies.set(SESSION.COOKIE_NAME, sessionToken, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			path: '/',
			expires: expiresAt
		});

		return json({ user: result }, { status: 201 });
	} catch (error) {
		console.error('Error in signup handler', error);
		return json({ error: 'Unable to complete signup' }, { status: 500 });
	}
};

