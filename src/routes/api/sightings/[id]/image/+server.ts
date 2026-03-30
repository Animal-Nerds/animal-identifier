import { db } from '$lib/db/client';
import { images, sightings } from '$lib/db/schema';
import { json, type RequestHandler } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, params, locals }) => {
  if (!locals.user?.id) {
    return json({ error: 'Unathorized' }, { status: 401 });
  }
  if (!params.id) {
    return json({ error: 'Sighting ID is Required' }, { status: 400 });
  }
  let row = await db.select().from(sightings).where(eq(sightings.id, params.id)).limit(1);
  let sighting = row[0];
  if (!sighting) {
    return json({ error: 'No  Sighting Found' }, { status: 404 });
  }
  if (sighting.userId !== locals.user.id) {
    return json({ error: 'Unathorized acess to image' }, { status: 403 });
  }
  let body;
  try {
    body = await request.json();
    if (!body.url) {
      throw new Error('Bad Request');
    }
  } catch (error) {
    return json({ error: 'Invalid Json' }, { status: 400 });
  }
  const [created] = await db
    .insert(images)
    .values({ sightingId: params.id, url: body.url, altText: body.alt_text })
    .returning();
  return json(created, { status: 201 });
};
