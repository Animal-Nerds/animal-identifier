import { json } from '@sveltejs/kit';

export const GET = async ({ locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	return json({ user: { id: user.id, email: user.email } }, { status: 200 });
};

