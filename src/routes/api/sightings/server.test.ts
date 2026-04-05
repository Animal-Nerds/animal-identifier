import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── INSERT mock (used by POST tests) ───────────────────────────────────────

let insertedValues: Record<string, unknown> | null = null;
let returningRow: Record<string, unknown>;

const returningMock = vi.fn(async () => [returningRow]);
const valuesMock = vi.fn((values: Record<string, unknown>) => {
    insertedValues = values;
    return { returning: returningMock };
});
const insertMock = vi.fn(() => ({ values: valuesMock }));

// ─── SELECT mock (used by GET tests) ────────────────────────────────────────
// Each db.select() call creates a chainable query. When awaited, it resolves
// to the next entry in selectResults (consumed in order).

let selectResults: unknown[][] = [];
let selectCallCount = 0;

const selectMock = vi.fn(() => {
    const callIndex = selectCallCount++;
    const chain: Record<string, any> = {};
    const self = () => chain;
    chain.from = vi.fn(self);
    chain.where = vi.fn(self);
    chain.orderBy = vi.fn(self);
    chain.limit = vi.fn(self);
    chain.offset = vi.fn(self);
    chain.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) => {
        return Promise.resolve(selectResults[callIndex] ?? []).then(resolve, reject);
    };
    return chain;
});

vi.mock('$lib/db/client', () => ({
    db: {
        insert: insertMock,
        select: selectMock
    }
}));

// Import after vi.mock so GET/POST use mocked db.
const { GET, POST } = await import('./+server');

function makeRequest(body: unknown): Request {
    return new Request('http://localhost/api/sightings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
    });
}

async function callPost(opts: { body: unknown; userId?: string }) {
    const request = makeRequest(opts.body);
    const locals = opts.userId ? { user: { id: opts.userId } } : {};
    const response = await POST({ request, locals } as never);
    const json = await response.json();
    return { response, json };
}

describe('POST /api/sightings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        insertedValues = null;
        selectResults = [];
        selectCallCount = 0;

        returningRow = {
            id: '11111111-1111-1111-1111-111111111111',
            userId: '22222222-2222-2222-2222-222222222222',
            species: 'Bald Eagle',
            description: 'Near river',
            latitude: 45.123,
            longitude: -122.123,
            sightedAt: new Date('2026-03-20T10:00:00.000Z'),
            createdAt: new Date('2026-03-20T10:00:00.000Z'),
            updatedAt: new Date('2026-03-20T10:00:00.000Z')
        };
    });

    it('returns 401 when no valid session', async () => {
        const { response, json } = await callPost({
            body: { species: 'Fox', latitude: 45, longitude: -122 }
        });

        expect(response.status).toBe(401);
        expect(json).toEqual({ error: 'Unauthorized' });
        expect(insertMock).not.toHaveBeenCalled();
    });

    it('returns 400 with list of validation errors', async () => {
        const { response, json } = await callPost({
            userId: 'user-1',
            body: {
                species: '',
                latitude: 'bad',
                longitude: null
            }
        });

        expect(response.status).toBe(400);
        expect(Array.isArray(json.errors)).toBe(true);
        expect(json.errors).toContain('species is required');
        expect(json.errors).toContain('latitude must be a number');
        expect(json.errors).toContain('longitude must be a number');
        expect(insertMock).not.toHaveBeenCalled();
    });

    // it('rejects userId in request body', async () => {
    //     const { response, json } = await callPost({
    //         userId: 'session-user',
    //         body: {
    //             userId: 'attacker-user',
    //             species: 'Fox',
    //             latitude: 45,
    //             longitude: -122
    //         }
    //     });
    //
    //     expect(response.status).toBe(400);
    //     expect(json.errors).toContain('userId is not allowed in request body');
    //     expect(insertMock).not.toHaveBeenCalled();
    // });

    it('uses locals.user.id for inserted userId', async () => {
        await callPost({
            userId: 'session-user-123',
            body: {
                species: 'Fox',
                latitude: 45,
                longitude: -122,
                userId: undefined
            }
        });

        expect(insertMock).toHaveBeenCalledTimes(1);
        expect(valuesMock).toHaveBeenCalledTimes(1);
        expect(insertedValues?.userId).toBe('session-user-123');
    });

    it('defaults seen_at when omitted', async () => {
        const start = Date.now();

        const { response } = await callPost({
            userId: 'session-user-123',
            body: {
                species: 'Fox',
                latitude: 45,
                longitude: -122
            }
        });

        const end = Date.now();

        expect(response.status).toBe(201);
        expect(insertedValues).not.toBeNull();
        expect(insertedValues?.sightedAt).toBeInstanceOf(Date);

        const insertedMs = (insertedValues?.sightedAt as Date).getTime();
        expect(insertedMs).toBeGreaterThanOrEqual(start - 1000);
        expect(insertedMs).toBeLessThanOrEqual(end + 1000);
    });

    it('returns 201 with full created object including id', async () => {
        const { response, json } = await callPost({
            userId: 'session-user-123',
            body: {
                species: 'Bald Eagle',
                description: 'Near river',
                latitude: 45.123,
                longitude: -122.123
            }
        });

        expect(response.status).toBe(201);
        expect(json.id).toBeDefined();
        expect(json.id).toBe('11111111-1111-1111-1111-111111111111');
        expect(json.species).toBe('Bald Eagle');
        expect(json.userId).toBe('22222222-2222-2222-2222-222222222222');
    });

    it('returns 400 for invalid JSON body', async () => {
        const request = new Request('http://localhost/api/sightings', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: '{ bad json'
        });

        const response = await POST({
            request,
            locals: { user: { id: 'session-user' } }
        } as never);

        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.errors).toContain('Request body must be valid JSON');
        expect(insertMock).not.toHaveBeenCalled();
    });
});

// ─── GET /api/sightings ─────────────────────────────────────────────────────

function makeUrl(params: Record<string, string> = {}): URL {
    const url = new URL('http://localhost/api/sightings');
    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
    }
    return url;
}

async function callGet(opts: { userId?: string; params?: Record<string, string> } = {}) {
    const url = makeUrl(opts.params);
    const locals = opts.userId ? { user: { id: opts.userId } } : {};
    const response = await GET({ url, locals } as never);
    const json = await response.json();
    return { response, json };
}

describe('GET /api/sightings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        selectResults = [];
        selectCallCount = 0;
    });

    it('returns 401 when not authenticated', async () => {
        const { response, json } = await callGet();

        expect(response.status).toBe(401);
        expect(json).toEqual({ error: 'Unauthorized' });
        expect(selectMock).not.toHaveBeenCalled();
    });

    it('returns 200 with paginated response shape', async () => {
        const sightingRow = {
            id: 'sight-1',
            userId: 'user-1',
            species: 'Fox',
            description: 'By the creek',
            latitude: 45.0,
            longitude: -122.0,
            imageUrl: null,
            isDeleted: false,
            sightedAt: new Date('2026-03-20T10:00:00Z'),
            createdAt: new Date('2026-03-20T10:00:00Z'),
            updatedAt: new Date('2026-03-20T10:00:00Z')
        };

        selectResults = [
            [{ total: 1 }],       // count query
            [sightingRow],         // sightings query
            []                     // images query (no images)
        ];

        const { response, json } = await callGet({ userId: 'user-1' });

        expect(response.status).toBe(200);
        expect(json.data).toHaveLength(1);
        expect(json.total).toBe(1);
        expect(json.page).toBe(1);
        expect(json.limit).toBe(50);
    });

    it('returns normalized sighting fields', async () => {
        const sightingRow = {
            id: 'sight-1',
            userId: 'user-1',
            species: 'Bald Eagle',
            description: 'Near river',
            latitude: 45.123,
            longitude: -122.456,
            imageUrl: null,
            isDeleted: false,
            sightedAt: new Date('2026-03-20T10:00:00Z'),
            createdAt: new Date('2026-03-20T10:00:00Z'),
            updatedAt: new Date('2026-03-20T11:00:00Z')
        };

        selectResults = [
            [{ total: 1 }],
            [sightingRow],
            []
        ];

        const { json } = await callGet({ userId: 'user-1' });
        const item = json.data[0];

        expect(item.id).toBe('sight-1');
        expect(item.userId).toBe('user-1');
        expect(item.species).toBe('Bald Eagle');
        expect(item.description).toBe('Near river');
        expect(item.latitude).toBe(45.123);
        expect(item.longitude).toBe(-122.456);
        expect(item.syncStatus).toBe('SYNCED');
        expect(item.images).toEqual([]);
    });

    it('includes image url from images table', async () => {
        const sightingRow = {
            id: 'sight-1',
            userId: 'user-1',
            species: 'Deer',
            description: null,
            latitude: 40,
            longitude: -70,
            imageUrl: null,
            isDeleted: false,
            sightedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        selectResults = [
            [{ total: 1 }],
            [sightingRow],
            [{ sightingId: 'sight-1', url: 'data:image/jpeg;base64,abc' }]
        ];

        const { json } = await callGet({ userId: 'user-1' });
        const item = json.data[0];

        expect(item.imageUrl).toBe('data:image/jpeg;base64,abc');
        expect(item.images).toEqual(['data:image/jpeg;base64,abc']);
    });

    it('prefers imageUrl column over images table', async () => {
        const sightingRow = {
            id: 'sight-1',
            userId: 'user-1',
            species: 'Hawk',
            description: null,
            latitude: 40,
            longitude: -70,
            imageUrl: 'data:image/png;base64,column-image',
            isDeleted: false,
            sightedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        selectResults = [
            [{ total: 1 }],
            [sightingRow],
            [{ sightingId: 'sight-1', url: 'data:image/jpeg;base64,table-image' }]
        ];

        const { json } = await callGet({ userId: 'user-1' });

        expect(json.data[0].imageUrl).toBe('data:image/png;base64,column-image');
    });

    it('returns empty data when user has no sightings', async () => {
        selectResults = [
            [{ total: 0 }],
            []
        ];

        const { response, json } = await callGet({ userId: 'user-1' });

        expect(response.status).toBe(200);
        expect(json.data).toEqual([]);
        expect(json.total).toBe(0);
        // Should not query images table when there are no sightings
        expect(selectMock).toHaveBeenCalledTimes(2);
    });

    it('respects page and limit query params', async () => {
        selectResults = [
            [{ total: 25 }],
            [],
        ];

        const { json } = await callGet({ userId: 'user-1', params: { page: '3', limit: '5' } });

        expect(json.page).toBe(3);
        expect(json.limit).toBe(5);
        expect(json.total).toBe(25);
    });

    it('caps limit at PAGINATION.MAX_LIMIT', async () => {
        selectResults = [
            [{ total: 0 }],
            [],
        ];

        const { json } = await callGet({ userId: 'user-1', params: { limit: '9999' } });

        expect(json.limit).toBe(100);
    });

    it('defaults to page 1 and limit 50', async () => {
        selectResults = [
            [{ total: 0 }],
            [],
        ];

        const { json } = await callGet({ userId: 'user-1' });

        expect(json.page).toBe(1);
        expect(json.limit).toBe(50);
    });
});
