import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { db } from '$lib/server/db';
import { generateSessionToken, verifyPassword } from '$lib/server/auth';
import { users, sessions } from '$lib/db/schema';
import { validateEmail } from '$lib/utils/validation';
import { SESSION } from '$lib/utils/constants';

const SALT_ROUNDS = 12;
const FAKE_PASSWORD_HASH = bcrypt.hashSync('invalid_password', SALT_ROUNDS);

export const POST = async (event) => {
	const { request, cookies, url } = event;
	let email: unknown;
	let password: unknown;

	try {
		const raw = await request.text();
		const body = JSON.parse(raw) as { email?: unknown; password?: unknown };
		email = body.email;
		password = body.password;
	} catch {
		return json({ errors: ['Invalid JSON body'] }, { status: 400 });
	}

	if (typeof email !== 'string' || typeof password !== 'string') {
		return json({ errors: ['Email and password are required'] }, { status: 400 });
	}

	// We still validate format early (optional) but never disclose whether email exists.
	const emailResult = validateEmail(email);
	if (!emailResult.valid) {
		return json({ errors: emailResult.errors }, { status: 400 });
	}

	const existing = await db.select({ id: users.id, email: users.email, passwordHash: users.passwordHash }).from(users).where(eq(users.email, email)).limit(1);
	const user = existing[0];

	const passwordValid = user
		? await verifyPassword(password, user.passwordHash)
		: await verifyPassword(password, FAKE_PASSWORD_HASH);

	if (!user || !passwordValid) {
		return json({ error: 'Invalid email or password' }, { status: 401 });
	}

	try {
		const token = generateSessionToken();
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + SESSION.DURATION_DAYS);

		await db.transaction(async (tx) => {
			await tx.insert(sessions).values({
				token,
				userId: user.id,
				expiresAt
			});
		});

		const maxAgeSeconds = SESSION.DURATION_DAYS * 24 * 60 * 60;

		cookies.set(SESSION.COOKIE_NAME, token, {
			path: '/',
			httpOnly: true,
			secure: url.protocol === 'https:',
			sameSite: 'strict',
			maxAge: maxAgeSeconds
		});

		return json({ user: { id: user.id, email: user.email } }, { status: 200 });
	} catch {
		return json({ error: 'Login failed' }, { status: 500 });
	}
};

