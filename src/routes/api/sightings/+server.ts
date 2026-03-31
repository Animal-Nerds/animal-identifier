import { json, type RequestHandler } from '@sveltejs/kit';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/db/client';
import { images, sightings } from '$lib/db/schema';
import { VALIDATION } from '$lib/utils/constants';

// This endpoint is for creating new sightings. All other operations on sightings (fetching, updating, deleting) are done through the /sightings/[id] endpoint.
type CreateSightingBody = {
    species?: unknown;
    description?: unknown;
    latitude?: unknown;
    longitude?: unknown;
    seen_at?: unknown;
    images?: unknown;
    userId?: unknown;
    user_id?: unknown;
};

function toIsoString(value: Date | string | null | undefined): string | undefined {
    if (!value) return undefined;
    if (typeof value === 'string') {
        return value;
    }
    return value.toISOString();
}

export const GET: RequestHandler = async ({ locals }) => {
    if (!locals.user?.id) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await db
        .select()
        .from(sightings)
        .where(and(eq(sightings.userId, locals.user.id), eq(sightings.isDeleted, false)))
        .orderBy(desc(sightings.createdAt));

    const sightingIds = rows.map((row) => row.id);
    const imageRows =
        sightingIds.length > 0
            ? await db
                .select({
                    sightingId: images.sightingId,
                    url: images.url
                })
                .from(images)
                .where(inArray(images.sightingId, sightingIds))
            : [];

    const firstImageBySightingId = new Map<string, string>();
    for (const imageRow of imageRows) {
        if (!firstImageBySightingId.has(imageRow.sightingId)) {
            firstImageBySightingId.set(imageRow.sightingId, imageRow.url);
        }
    }

    const normalized = rows.map((row) => {
        // Prefer explicit image_url column, then fallback to first related image.
        const resolvedImageUrl = row.imageUrl ?? firstImageBySightingId.get(row.id);
        return {
            imageUrl: resolvedImageUrl ?? undefined,
            id: row.id,
            userId: row.userId,
            species: row.species,
            description: row.description ?? undefined,
            latitude: row.latitude ?? 0,
            longitude: row.longitude ?? 0,
            createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
            updatedAt: toIsoString(row.updatedAt),
            images: resolvedImageUrl ? [resolvedImageUrl] : [],
            syncStatus: 'SYNCED' as SyncStatus
        };
    });

    return json(normalized, { status: 200 });
};

// Note: we don't use a Zod schema here because we want to allow extra fields in the request body without causing validation to fail, and Zod's strict schemas would reject any unknown fields. Instead, we manually validate the required fields and ignore any additional ones.
export const POST: RequestHandler = async ({ request, locals }) => {
    if (!locals.user?.id) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;

    // First, we attempt to parse the request body as JSON. If this fails, we return a 400 error indicating that the body must be valid JSON.
    try {
        body = await request.json();
    } catch {
        return json({ errors: ['Request body must be valid JSON'] }, { status: 400 });
    }

    // Next, we check that the parsed body is an object (and not an array or other type). If it's not an object, we return a 400 error indicating that the body must be an object.
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return json({ errors: ['Request body must be an object'] }, { status: 400 });
    }

    const data = body as CreateSightingBody;
    const errors: string[] = [];

    // We then validate the presence and types of the required fields (species, latitude, longitude) and the optional fields (description, seen_at). We also check that userId is not included in the request body, as it should be derived from the authenticated user rather than provided by the client.
    if ('userId' in data || 'user_id' in data) {
        errors.push('userId is not allowed in request body');
    }

    // We validate that the species field is a non-empty string, as it's required for creating a sighting.
    if (typeof data.species !== 'string' || data.species.trim().length === 0) {
        errors.push('species is required');
    }

    // We validate that latitude and longitude are numbers within the valid ranges for geographic coordinates. This ensures that the sighting location is valid.
    if (typeof data.latitude !== 'number' || Number.isNaN(data.latitude)) {
        errors.push('latitude must be a number');
    } else if (data.latitude < VALIDATION.LATITUDE.MIN || data.latitude > VALIDATION.LATITUDE.MAX) {
        errors.push(`latitude must be between ${VALIDATION.LATITUDE.MIN} and ${VALIDATION.LATITUDE.MAX}`);
    }

    // Similar validation is performed for longitude to ensure it's a valid geographic coordinate.
    if (typeof data.longitude !== 'number' || Number.isNaN(data.longitude)) {
        errors.push('longitude must be a number');
    } else if (
        data.longitude < VALIDATION.LONGITUDE.MIN ||
        data.longitude > VALIDATION.LONGITUDE.MAX
    ) {
        errors.push(
            `longitude must be between ${VALIDATION.LONGITUDE.MIN} and ${VALIDATION.LONGITUDE.MAX}`
        );
    }

    // If the description field is provided, we validate that it's a string. This allows for an optional description of the sighting while ensuring that if it's included, it's in the correct format.
    if (
        data.description !== undefined &&
        data.description !== null &&
        typeof data.description !== 'string'
    ) {
        errors.push('description must be a string when provided');
    }

    // For the seen_at field, we validate that if it's provided, it's a valid ISO timestamp string. If it's not provided, we default to the current date and time for when the sighting was observed.
    let sightedAt = new Date();
    if (data.seen_at !== undefined) {
        if (typeof data.seen_at !== 'string') {
            errors.push('seen_at must be an ISO timestamp string');
        } else {
            const parsed = new Date(data.seen_at);
            if (Number.isNaN(parsed.getTime())) {
                errors.push('seen_at must be a valid timestamp');
            } else {
                sightedAt = parsed;
            }
        }
    }

    // If any validation errors were collected, we return a 400 response with the list of errors. This allows the client to understand what was wrong with their request and how to fix it.
    if (errors.length > 0) {
        return json({ errors }, { status: 400 });
    }

    const firstImage =
        Array.isArray(data.images) && typeof data.images[0] === 'string' ? data.images[0] : null;

    // If validation passes, we proceed to insert the new sighting into the database. We use the authenticated user's ID from locals.user.id to associate the sighting with the correct user, rather than relying on any userId that might have been included in the request body.
    // Extract images from the request body if provided.
    const imageList = Array.isArray((data as any).images)
        ? (data as any).images
            .filter((img: any) => typeof img === 'object' && typeof img.url === 'string')
            .map((img: any) => img.url as string)
        : [];

    const [created] = await db
        .insert(sightings)
        .values({
            userId: locals.user.id,
            species: (data.species as string).trim(),
            description: (data.description as string | null | undefined) ?? null,
            latitude: data.latitude as number,
            longitude: data.longitude as number,
            sightedAt,
            imageUrl: firstImage
        })
        .returning();

    // Save any images that were included with the sighting.
    let savedImages: typeof images.$inferSelect[] = [];
    if (imageList.length > 0) {
        savedImages = await db
            .insert(images)
            .values(
                imageList.map((url: string, i: number) => ({
                    sightingId: created.id,
                    url,
                    order: i
                }))
            )
            .returning();
    }

    return json({ ...created, images: savedImages }, { status: 201 });
};