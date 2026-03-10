import dotenv from 'dotenv';
import { db } from '$lib/server/db/client';
import { sightings } from '$lib/server/db/schema';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

async function main() {
	await db.insert(sightings).values([
		{
			animal: 'Fox',
			location: 'Evergreen Forest'
		},
		{
			animal: 'Deer',
			location: 'River Valley'
		}
	]);

	// eslint-disable-next-line no-console
	console.log('Seed data inserted into sightings table.');
}

main().catch((error) => {
	// eslint-disable-next-line no-console
	console.error('Error while seeding database:', error);
	process.exit(1);
});

