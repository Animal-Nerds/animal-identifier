import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { hashPassword, generateSessionToken } from '$lib/server/auth';
import { users, sessions } from '$lib/db/schema';
import { validateEmail, validatePassword } from '$lib/utils/validation';
import { SESSION } from '$lib/utils/constants';

export const POST = async (event) => {
	const { request, cookies, url } = event;
	let email: unknown;
	let password: unknown;

	try {
		const raw = await request.text();
		const body = JSON.parse(raw) as unknown;
		email = body?.email;
		password = body?.password;
	} catch {
		return json({ errors: ['Invalid JSON body'] }, { status: 400 });
	}

	const emailResult = validateEmail(email as string);
	const passwordResult = validatePassword(password as string);

	const errors = [...emailResult.errors, ...passwordResult.errors];
	if (errors.length > 0) {
		return json({ errors }, { status: 400 });
	}

	// Validate duplicate email before touching any DB mutation.
	const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email as string)).limit(1);
	if (existing.length > 0) {
		return json({ error: 'Email already registered' }, { status: 409 });
	}

	const passwordHash = await hashPassword(password as string);

	try {
		const { user, token } = await db.transaction(async (tx) => {
			const userName = (email as string).split('@')[0] || 'User';

			const insertedUsers = await tx
				.insert(users)
				.values({
					email: email as string,
					name: userName,
					avatarUrl: null,
					passwordHash
				})
				.returning({ id: users.id, email: users.email });

			const createdUser = insertedUsers[0];
			if (!createdUser) {
				throw new Error('User insert failed');
			}

			const token = generateSessionToken();
			const expiresAt = new Date();
			expiresAt.setDate(expiresAt.getDate() + SESSION.DURATION_DAYS);

			await tx.insert(sessions).values({
				token,
				userId: createdUser.id,
				expiresAt
			});

			return { user: createdUser, token };
		});

		const maxAgeSeconds = SESSION.DURATION_DAYS * 24 * 60 * 60;

		cookies.set(SESSION.COOKIE_NAME, token, {
			path: '/',
			httpOnly: true,
			secure: url.protocol === 'https:',
			sameSite: 'strict',
			maxAge: maxAgeSeconds
		});

		return json({ user: { id: user.id, email: user.email } }, { status: 201 });
	} catch {
		return json({ error: 'Signup failed' }, { status: 500 });
	}
};

