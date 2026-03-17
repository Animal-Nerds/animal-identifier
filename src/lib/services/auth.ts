import crypto from 'node:crypto';

import { SESSION } from '$lib/utils/constants';

const SCRYPT_PARAMS = {
	N: 16384,
	r: 8,
	p: 1,
	keyLength: 64
} as const;

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.randomBytes(16);

	const derivedKey = await new Promise<Buffer>((resolve, reject) => {
		crypto.scrypt(password, salt, SCRYPT_PARAMS.keyLength, SCRYPT_PARAMS, (err, key) => {
			if (err) return reject(err);
			resolve(key as Buffer);
		});
	});

	return [
		'v1',
		salt.toString('base64'),
		derivedKey.toString('base64'),
		SCRYPT_PARAMS.N,
		SCRYPT_PARAMS.r,
		SCRYPT_PARAMS.p
	].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const [version, saltB64, hashB64, NStr, rStr, pStr] = stored.split('$');

	if (version !== 'v1') return false;
	if (!saltB64 || !hashB64 || !NStr || !rStr || !pStr) return false;

	const salt = Buffer.from(saltB64, 'base64');
	const N = Number(NStr);
	const r = Number(rStr);
	const p = Number(pStr);

	const derivedKey = await new Promise<Buffer>((resolve, reject) => {
		crypto.scrypt(
			password,
			salt,
			Buffer.from(hashB64, 'base64').length,
			{ N, r, p },
			(err, key) => {
				if (err) return reject(err);
				resolve(key as Buffer);
			}
		);
	});

	return crypto.timingSafeEqual(derivedKey, Buffer.from(hashB64, 'base64'));
}

export function createSessionToken(): string {
	return crypto.randomBytes(32).toString('hex');
}

export function getSessionExpiry(): Date {
	const expires = new Date();
	expires.setDate(expires.getDate() + SESSION.DURATION_DAYS);
	return expires;
}

