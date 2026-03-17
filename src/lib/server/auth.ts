// import bcrypt from 'bcrypt'; //needs declaration file, but it doesn't exist yet
// import crypto from 'crypto';
// import { db } from '$lib/server/db'; //needs declaration file, but it doesn't exist yet

// const SALT_ROUNDS = 12;


// export async function hashPassword(password: string): Promise<string> {
//   return bcrypt.hash(password, SALT_ROUNDS);
// }

// export async function verifyPassword(
//   plain: string,
//   hash: string
// ): Promise<boolean> {
//   return bcrypt.compare(plain, hash);
// }

// export function generateSessionToken(): string {
//   return crypto.randomBytes(32).toString('hex');
// }

// export async function createSession(userId: string): Promise<string> {
//   const token = generateSessionToken();

//   const expiresAt = new Date();
//   expiresAt.setDate(expiresAt.getDate() + 7);

//   await db.session.create({
//     data: {
//       token,
//       userId,
//       expiresAt
//     }
//   });

//   return token;
// }

// export async function deleteSession(token: string): Promise<void> {
//   await db.session.delete({
//     where: { token }
//   });
// }