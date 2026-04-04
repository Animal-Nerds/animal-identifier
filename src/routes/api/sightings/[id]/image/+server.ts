import { db } from '$lib/db/client';
import { images, sightings } from '$lib/db/schema';
import { json, type RequestHandler } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user?.id) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!params.id) {
    return json({ error: 'Sighting ID is required' }, { status: 400 });
  }

  const sightingRows = await db
    .select()
    .from(sightings)
    .where(and(eq(sightings.id, params.id), eq(sightings.isDeleted, false)))
    .limit(1);

  if (sightingRows.length === 0) {
    return json({ error: 'Sighting not found' }, { status: 404 });
  }

  if (sightingRows[0].userId !== locals.user.id) {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  // Check sightings.imageUrl first (inline image), then fall back to images table
  const sighting = sightingRows[0];
  if (sighting.imageUrl) {
    return json({ image_data: sighting.imageUrl }, { status: 200 });
  }

  const imageRows = await db
    .select()
    .from(images)
    .where(eq(images.sightingId, params.id))
    .limit(1);

  if (imageRows.length === 0) {
    return json({ error: 'No image found for this sighting' }, { status: 404 });
  }

  return json({ image_data: imageRows[0].url }, { status: 200 });
};

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
  } catch (error) {
    return json({ error: 'Invalid Json' }, { status: 400 });
  }
  if (!body || !body.url) {
    return json({ error: 'Image URL is required' }, { status: 400 });
  }
  const [created] = await db
    .insert(images)
    .values({ sightingId: params.id, url: body.url, altText: body.alt_text })
    .returning();
  return json(created, { status: 201 });
};
