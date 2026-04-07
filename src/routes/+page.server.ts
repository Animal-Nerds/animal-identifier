import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = ((event) => {
  if (event.locals.token) {
    redirect(302, '/dashboard');
  }
}) satisfies PageServerLoad;
