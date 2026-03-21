import { beforeEach, describe, expect, it, vi } from 'vitest';

let insertedValues: Record<string, unknown> | null = null;
let returningRow: Record<string, unknown>;

const returningMock = vi.fn(async () => [returningRow]);
const valuesMock = vi.fn((values: Record<string, unknown>) => {
    insertedValues = values;
    return { returning: returningMock };
});
const insertMock = vi.fn(() => ({ values: valuesMock }));

vi.mock('$lib/db/client', () => ({
    db: {
        insert: insertMock
    }
}));

// Import after vi.mock so POST uses mocked db.
const { POST } = await import('./+server');

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

    it('rejects userId in request body', async () => {
        const { response, json } = await callPost({
            userId: 'session-user',
            body: {
                userId: 'attacker-user',
                species: 'Fox',
                latitude: 45,
                longitude: -122
            }
        });

        expect(response.status).toBe(400);
        expect(json.errors).toContain('userId is not allowed in request body');
        expect(insertMock).not.toHaveBeenCalled();
    });

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