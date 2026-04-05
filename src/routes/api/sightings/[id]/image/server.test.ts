import { beforeEach, describe, expect, it, vi } from 'vitest';

// Track select query calls — each .limit() resolves a separate query
let selectResults: unknown[][] = [];
let selectCallIndex = 0;

const limitMock = vi.fn(() => {
    const idx = selectCallIndex++;
    return Promise.resolve(selectResults[idx] ?? []);
});
const whereMock = vi.fn(() => ({ limit: limitMock }));
const fromMock = vi.fn(() => ({ where: whereMock }));
const selectMock = vi.fn(() => ({ from: fromMock }));

vi.mock('$lib/db/client', () => ({
    db: {
        select: selectMock
    }
}));

const { GET } = await import('./+server');

type CallGetOptions = {
    id?: string;
    userId?: string;
};

async function callGet(options: CallGetOptions = {}) {
    const id = 'id' in options ? options.id : 'sighting-1';
    const userId = options.userId;
    const response = await GET({
        params: id ? { id } : ({} as any),
        locals: userId ? { user: { id: userId } } : {}
    } as never);
    const json = await response.json();
    return { response, json };
}

function makeSighting(overrides: Record<string, unknown> = {}) {
    return {
        id: 'sighting-1',
        userId: 'user-1',
        species: 'Bald Eagle',
        description: 'Near river',
        latitude: 45.123,
        longitude: -122.123,
        imageUrl: null,
        isDeleted: false,
        sightedAt: new Date('2026-03-21T12:34:56.000Z'),
        createdAt: new Date('2026-03-21T12:34:56.000Z'),
        updatedAt: new Date('2026-03-21T12:34:56.000Z'),
        ...overrides
    };
}

describe('GET /api/sightings/[id]/image', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        selectResults = [];
        selectCallIndex = 0;
    });

    it('returns 401 if user is not authenticated', async () => {
        const { response, json } = await callGet({ userId: undefined });

        expect(response.status).toBe(401);
        expect(json).toEqual({ error: 'Unauthorized' });
        expect(selectMock).not.toHaveBeenCalled();
    });

    it('returns 400 if sighting ID is not provided', async () => {
        const { response, json } = await callGet({ id: undefined, userId: 'user-1' });

        expect(response.status).toBe(400);
        expect(json).toEqual({ error: 'Sighting ID is required' });
        expect(selectMock).not.toHaveBeenCalled();
    });

    it('returns 404 if sighting does not exist', async () => {
        selectResults = [[]];

        const { response, json } = await callGet({ id: 'missing-id', userId: 'user-1' });

        expect(response.status).toBe(404);
        expect(json).toEqual({ error: 'Sighting not found' });
        expect(selectMock).toHaveBeenCalledTimes(1);
    });

    it('returns 404 for soft-deleted sighting', async () => {
        // The where clause filters isDeleted=false, so a deleted sighting returns empty
        selectResults = [[]];

        const { response, json } = await callGet({ id: 'sighting-1', userId: 'user-1' });

        expect(response.status).toBe(404);
        expect(json).toEqual({ error: 'Sighting not found' });
    });

    it('returns 403 if sighting belongs to a different user', async () => {
        selectResults = [[makeSighting({ userId: 'other-user' })]];

        const { response, json } = await callGet({ id: 'sighting-1', userId: 'user-1' });

        expect(response.status).toBe(403);
        expect(json).toEqual({ error: 'Forbidden' });
        expect(selectMock).toHaveBeenCalledTimes(1);
    });

    it('returns 200 with image_data from sightings.imageUrl when present', async () => {
        selectResults = [[makeSighting({ imageUrl: 'data:image/jpeg;base64,abc123' })]];

        const { response, json } = await callGet({ id: 'sighting-1', userId: 'user-1' });

        expect(response.status).toBe(200);
        expect(json).toEqual({ image_data: 'data:image/jpeg;base64,abc123' });
        // Should not query images table since imageUrl was on the sighting
        expect(selectMock).toHaveBeenCalledTimes(1);
    });

    it('returns 200 with image_data from images table when sighting has no imageUrl', async () => {
        selectResults = [
            [makeSighting({ imageUrl: null })],
            [{ id: 'img-1', sightingId: 'sighting-1', url: 'https://example.com/photo.jpg' }]
        ];

        const { response, json } = await callGet({ id: 'sighting-1', userId: 'user-1' });

        expect(response.status).toBe(200);
        expect(json).toEqual({ image_data: 'https://example.com/photo.jpg' });
        expect(selectMock).toHaveBeenCalledTimes(2);
    });

    it('returns 404 when sighting has no imageUrl and no images in table', async () => {
        selectResults = [
            [makeSighting({ imageUrl: null })],
            []
        ];

        const { response, json } = await callGet({ id: 'sighting-1', userId: 'user-1' });

        expect(response.status).toBe(404);
        expect(json).toEqual({ error: 'No image found for this sighting' });
        expect(selectMock).toHaveBeenCalledTimes(2);
    });
});
