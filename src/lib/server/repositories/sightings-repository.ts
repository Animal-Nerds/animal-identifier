import { db } from '../db/client';
import { sightings } from '../db/schema';

export type Sighting = {
	id: number;
	animal: string;
	location: string;
	createdAt: Date;
};

export type NewSightingInput = {
	animal: string;
	location: string;
};

export async function createSighting(input: NewSightingInput): Promise<Sighting> {
	const [row] = await db
		.insert(sightings)
		.values({
			animal: input.animal,
			location: input.location
		})
		.returning();

	return row as Sighting;
}

export async function listSightings(): Promise<Sighting[]> {
	const rows = await db.query.sightings.findMany({
		orderBy: (row, { asc }) => asc(row.createdAt)
	});
	return rows as Sighting[];
}

export async function getSightingById(id: number): Promise<Sighting | undefined> {
	const row = await db.query.sightings.findFirst({
		where: (row, { eq }) => eq(row.id, id)
	});
	return row as Sighting | undefined;
}

