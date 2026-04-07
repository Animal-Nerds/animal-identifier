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
        .select({ id: images.id, url: images.url })
        .from(images)
        .where(eq(images.sightingId, sighting.id))
        .limit(1);

    const firstImageUrl = imageRows[0]?.url ?? sighting.imageUrl ?? null;

    // We then construct the response object with the sighting details and a boolean indicating whether an image is associated with the sighting. The has_image field is set to true if at least one image is found, and false otherwise.
    const response = {
        id: sighting.id,
        animal_name: sighting.species,
        location: sighting.description ?? null,
        latitude: sighting.latitude,
        longitude: sighting.longitude,
        timestamp: sighting.sightedAt,
        has_image: imageRows.length > 0 || !!sighting.imageUrl,
        image_url: firstImageUrl,
        created_at: sighting.createdAt,
        updated_at: sighting.updatedAt
    }

    // Finally, we return the response object with a 200 OK status.
    return json(response, { status: 200 });
};

function firstImageUrlFromBody(images: unknown): string | null {
    if (!Array.isArray(images) || images.length === 0) return null;
    const first = images[0] as unknown;
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && 'url' in first && typeof (first as { url: unknown }).url === 'string') {
        return (first as { url: string }).url;
    }
    return null;
}

function normalizeSightingResponse(
    row: typeof sightings.$inferSelect,
    imageUrl: string | null
): Record<string, unknown> {
    const createdAt =
        row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt);
    const updatedAt =
        row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt);
    return {
        id: row.id,
        userId: row.userId,
        species: row.species,
        description: row.description ?? undefined,
        latitude: row.latitude ?? 0,
        longitude: row.longitude ?? 0,
        createdAt,
        updatedAt,
        images: imageUrl
            ? [{ id: '', sightingId: row.id, url: imageUrl, createdAt: new Date().toISOString() }]
            : [],
        imageUrl: imageUrl ?? undefined
    };
}

export const PUT: RequestHandler = async ({ request, params, locals }) => {
    // 401: Unauthenticated
    if (!locals.user?.id) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
        return json({ error: 'Sighting ID is required' }, { status: 400 });
    }

    // Check sighting exists and belongs to user
    const sightingRows = await db
        .select()
        .from(sightings)
        .where(eq(sightings.id, id))
        .limit(1);

    if (sightingRows.length === 0 || sightingRows[0].isDeleted) {
        return json({ error: 'Sighting not found' }, { status: 404 });
    }

    const existing = sightingRows[0];
    if (existing.userId !== locals.user.id) {
        return json({ error: 'Sighting not found' }, { status: 404 });
    }

    // Parse request body
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return json({ error: 'Request body must be valid JSON' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return json({ error: 'Request body must be an object' }, { status: 400 });
    }

    const data = body as Record<string, unknown>;
    const errors: string[] = [];

    // Reject non-updatable fields
    const nonUpdatableFields = ['id', 'userId', 'user_id', 'createdAt', 'created_at', 'isDeleted', 'is_deleted'];
    for (const field of nonUpdatableFields) {
        if (field in data) {
            errors.push(`${field} is not allowed in request body`);
        }
    }

    // Build patch object with updatable fields only
    const patch: {
        updatedAt: Date;
        species?: string;
        description?: string | null;
        latitude?: number;
        longitude?: number;
        sightedAt?: Date;
    } = {
        updatedAt: new Date()
    };

    // animal_name or species (POST /sightings and the client use `species`)
    const rawAnimalName =
        data.animal_name !== undefined ? data.animal_name : data.species;
    if (rawAnimalName !== undefined) {
        if (typeof rawAnimalName !== 'string' || rawAnimalName.trim().length === 0) {
            errors.push('animal_name must be a non-empty string');
        } else if (rawAnimalName.length > VALIDATION.ANIMAL_NAME.MAX_LENGTH) {
            errors.push(`animal_name must not exceed ${VALIDATION.ANIMAL_NAME.MAX_LENGTH} characters`);
        } else {
            patch.species = rawAnimalName.trim();
        }
    }

    // location or description; empty string clears description (optional field from forms)
    const rawLocation =
        data.location !== undefined
            ? data.location
            : data.description !== undefined
              ? data.description
              : undefined;
    if (rawLocation !== undefined) {
        if (rawLocation === null) {
            patch.description = null;
        } else if (typeof rawLocation !== 'string') {
            errors.push('location must be a string');
        } else if (rawLocation.trim().length === 0) {
            patch.description = null;
        } else if (rawLocation.length > VALIDATION.LOCATION.MAX_LENGTH) {
            errors.push(`location must not exceed ${VALIDATION.LOCATION.MAX_LENGTH} characters`);
        } else {
            patch.description = rawLocation.trim();
        }
    }

    // Validate latitude
    if (data.latitude !== undefined) {
        if (typeof data.latitude !== 'number' || Number.isNaN(data.latitude)) {
            errors.push('latitude must be a number');
        } else if (data.latitude < VALIDATION.LATITUDE.MIN || data.latitude > VALIDATION.LATITUDE.MAX) {
            errors.push(`latitude must be between ${VALIDATION.LATITUDE.MIN} and ${VALIDATION.LATITUDE.MAX}`);
        } else {
            patch.latitude = data.latitude;
        }
    }

    // Validate longitude
    if (data.longitude !== undefined) {
        if (typeof data.longitude !== 'number' || Number.isNaN(data.longitude)) {
            errors.push('longitude must be a number');
        } else if (data.longitude < VALIDATION.LONGITUDE.MIN || data.longitude > VALIDATION.LONGITUDE.MAX) {
            errors.push(`longitude must be between ${VALIDATION.LONGITUDE.MIN} and ${VALIDATION.LONGITUDE.MAX}`);
        } else {
            patch.longitude = data.longitude;
        }
    }

    // Validate seen_at (maps to sightedAt in DB)
    if (data.seen_at !== undefined) {
        if (typeof data.seen_at !== 'string') {
            errors.push('seen_at must be an ISO 8601 timestamp string');
        } else {
            try {
                patch.sightedAt = new Date(data.seen_at as string);
                if (Number.isNaN(patch.sightedAt.getTime())) {
                    errors.push('seen_at must be a valid ISO 8601 timestamp');
                    delete patch.sightedAt;
                }
            } catch {
                errors.push('seen_at must be a valid ISO 8601 timestamp');
            }
        }
    }

    // Return validation errors
    if (errors.length > 0) {
        return json({ error: errors[0] }, { status: 400 });
    }

    // Update with ownership enforcement in WHERE clause
    const [updated] = await db
        .update(sightings)
        .set(patch)
        .where(and(eq(sightings.id, id), eq(sightings.userId, locals.user.id)))
        .returning();

    if (!updated) {
        return json({ error: 'Sighting not found' }, { status: 404 });
    }

    const imageRows = await db
        .select({ url: images.url })
        .from(images)
        .where(eq(images.sightingId, updated.id))
        .limit(1);

    const resolvedImageUrl = imageRows[0]?.url ?? updated.imageUrl ?? undefined;

    // Same shape as GET /api/sightings so the client store can merge without losing `species`
    return json(
        {
            imageUrl: resolvedImageUrl ?? undefined,
            id: updated.id,
            userId: updated.userId,
            species: updated.species,
            description: updated.description ?? undefined,
            latitude: updated.latitude ?? 0,
            longitude: updated.longitude ?? 0,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
            images: resolvedImageUrl ? [resolvedImageUrl] : [],
            syncStatus: 'SYNCED' as SyncStatus
        },
        { status: 200 }
    );
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
    if (!locals.user?.id) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = params;
    if (!id) {
        return json({ error: 'Sighting ID is required' }, { status: 400 });
    }

    const result = await db
        .update(sightings)
        .set({ isDeleted: true, updatedAt: new Date() })
        .where(and(eq(sightings.id, id), eq(sightings.userId, locals.user.id)))
        .returning({ id: sightings.id });

    if (result.length === 0) {
        return json({ error: 'Sighting not found' }, { status: 404 });
    }

    return json({ ok: true }, { status: 200 });
};