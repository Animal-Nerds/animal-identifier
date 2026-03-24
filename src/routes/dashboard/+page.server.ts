import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => {
  if (!event.locals.token) {
    throw redirect(302, '/login');
  }
  return { email: 'user@example.com' };
};
