import { json, type RequestHandler } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/db/client';
import { sightings, images } from '$lib/db/schema';
import { VALIDATION } from '$lib/utils/constants';


// This endpoint is for fetching a single sighting by its ID. It checks that the user is authenticated and that the sighting belongs to the authenticated user before returning the sighting details. If the sighting is not found or does not belong to the user, it returns appropriate error responses.
export const GET: RequestHandler = async ({ params, locals }) => { 
    // First, we check if the user is authenticated by verifying that locals.user.id exists. If the user is not authenticated, we return a 401 Unauthorized error.
    if (!locals.user?.id) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Next, we extract the sighting ID from the request parameters. If the ID is not provided, we return a 400 Bad Request error indicating that the sighting ID is required.
    const { id } = params;
    if (!id) {
        return json({ error: 'Sighting ID is required' }, { status: 400 });
    }

    // We then query the database for the sighting with the specified ID. If no sighting is found, we return a 404 Not Found error.
    const sightingRows = await db
        .select()
        .from(sightings)
        .where(eq(sightings.id, id))
        .limit(1);
    
    // If a sighting is found, we check if it belongs to the authenticated user by comparing the sighting's userId with the authenticated user's ID. If they do not match, we return a 403 Forbidden error.
    if (sightingRows.length === 0) {
        return json({ error: 'Sighting not found' }, { status: 404 });
    }

    // If the sighting belongs to the user, we proceed to check if there are any images associated with the sighting. We query the images table for any images that have a sightingId matching the sighting's ID. We limit the query to 1 result since we only need to know if at least one image exists.
    const sighting = sightingRows[0];

    // Finally, we construct the response object with the sighting details and a boolean indicating whether an image is associated with the sighting. We return this response with a 200 OK status.
    if (sighting.userId !== locals.user.id) {
        return json({ error: 'Forbidden' }, { status: 403 });
    }

    // We check for associated images by querying the images table for any records that have a sightingId matching the sighting's ID. We limit the query to 1 result since we only need to know if at least one image exists.
    const imageRows = await db
        .select({ id: images.id })
        .from(images)
        .where(eq(images.sightingId, sighting.id))
        .limit(1);

    // We then construct the response object with the sighting details and a boolean indicating whether an image is associated with the sighting. The has_image field is set to true if at least one image is found, and false otherwise.
    const response = {
        id: sighting.id,
        animal_name: sighting.species,
        location: sighting.description ?? null,
        latitude: sighting.latitude,
        longitude: sighting.longitude,
        timestamp: sighting.sightedAt,
        has_image: imageRows.length > 0,
        created_at: sighting.createdAt,
        updated_at: sighting.updatedAt
    }

    // Finally, we return the response object with a 200 OK status.
    return json(response, { status: 200 });
};

export const PUT: RequestHandler = async ({ request, params, locals }) => {
    if (!locals.user?.id) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
        return json({ error: 'Sighting ID is required' }, { status: 400 });
    }

    // Verify sighting exists and belongs to user
    const existing = await db
        .select()
        .from(sightings)
        .where(and(eq(sightings.id, id), eq(sightings.isDeleted, false)))
        .limit(1);

    if (existing.length === 0) {
        return json({ error: 'Sighting not found' }, { status: 404 });
    }

    if (existing[0].userId !== locals.user.id) {
        return json({ error: 'Forbidden' }, { status: 403 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return json({ errors: ['Request body must be valid JSON'] }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return json({ errors: ['Request body must be an object'] }, { status: 400 });
    }

    const data = body as Record<string, unknown>;
    const errors: string[] = [];

    if ('userId' in data || 'user_id' in data) {
        errors.push('userId is not allowed in request body');
    }

    if (data.species !== undefined) {
        if (typeof data.species !== 'string' || data.species.trim().length === 0) {
            errors.push('species must be a non-empty string');
        }
    }

    if (data.latitude !== undefined) {
        if (typeof data.latitude !== 'number' || Number.isNaN(data.latitude)) {
            errors.push('latitude must be a number');
        } else if (data.latitude < VALIDATION.LATITUDE.MIN || data.latitude > VALIDATION.LATITUDE.MAX) {
            errors.push(`latitude must be between ${VALIDATION.LATITUDE.MIN} and ${VALIDATION.LATITUDE.MAX}`);
        }
    }

    if (data.longitude !== undefined) {
        if (typeof data.longitude !== 'number' || Number.isNaN(data.longitude)) {
            errors.push('longitude must be a number');
        } else if (data.longitude < VALIDATION.LONGITUDE.MIN || data.longitude > VALIDATION.LONGITUDE.MAX) {
            errors.push(`longitude must be between ${VALIDATION.LONGITUDE.MIN} and ${VALIDATION.LONGITUDE.MAX}`);
        }
    }

    if (data.description !== undefined && data.description !== null && typeof data.description !== 'string') {
        errors.push('description must be a string when provided');
    }

    if (errors.length > 0) {
        return json({ errors }, { status: 400 });
    }

    // Build update object with only provided fields
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (data.species !== undefined) updates.species = (data.species as string).trim();
    if (data.description !== undefined) updates.description = data.description;
    if (data.latitude !== undefined) updates.latitude = data.latitude;
    if (data.longitude !== undefined) updates.longitude = data.longitude;

    const [updated] = await db
        .update(sightings)
        .set(updates)
        .where(eq(sightings.id, id))
        .returning();

    return json(updated, { status: 200 });
};