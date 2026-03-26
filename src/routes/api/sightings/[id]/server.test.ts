import { json } from 'stream/consumers';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const limitMock = vi.fn();
const whereMock = vi.fn(() => ({ limit: limitMock }));
const fromMock = vi.fn(() => ({ where: whereMock }));
const selectMock = vi.fn(() => ({ from: fromMock })); 

// We mock the database client to control the responses for our tests. The select method is mocked to return an object with a from method, which in turn returns an object with a where method, and so on. This allows us to simulate different database query results for our tests.
vi.mock('$lib/db/client', () => ({
    db: {
        select: selectMock
    }
}));

const { GET } = await import('./+server');

// Before each test, we reset the mock functions to ensure that previous test calls do not affect the current test. This is important for maintaining test isolation and ensuring that each test runs with a clean slate.
type CallGetOptions = { 
    id?: string;
    userId?: string;
};

// This helper function calls the GET request handler with specified parameters and returns both the response and the parsed JSON body. It allows us to easily test different scenarios by providing different sighting IDs and user IDs.
async function callGet({ id = 'sighting-1', userId }: CallGetOptions = {}) {
    const response = await GET({ 
        params: id? { id } : ({} as any),
        locals: userId ? {user: { id: userId } } : {}
    } as never);

    const json = await response.json();
    return { response, json };
}

// We define a test suite for the GET /api/sightings/[id] endpoint. Each test case within this suite checks a specific scenario, such as unauthenticated access, missing sighting ID, sighting not found, forbidden access, and successful retrieval of sighting data with or without associated images.
describe('Get /api/sightings/[id]', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // The first test checks that if the user is not authenticated (i.e., no user ID is provided in locals), the endpoint returns a 401 Unauthorized error. We also verify that the database select method is not called since the request should be rejected before any database query is made.
    it('returns 401 if user is not authenticated', async () => { 
        const { response, json } = await callGet({ userId: undefined });

        expect(response.status).toBe(401);
        expect(json).toEqual({ error: 'Unauthorized' });
        expect(selectMock).not.toHaveBeenCalled();
    });

    //  The second test checks that if the sighting ID is not provided in the request parameters, the endpoint returns a 400 Bad Request error. Similar to the previous test, we also verify that the database select method is not called since the request should be rejected before any database query is made.
    it('returns 400 if sighting ID is not provided', async () => {
        const { response, json } = await callGet({ id: undefined });

        expect(response.status).toBe(400);
        expect(json).toEqual({ error: 'Sighting ID is required' });
        expect(selectMock).not.toHaveBeenCalled();
    });

    // The third test checks that if the sighting with the specified ID does not exist in the database, the endpoint returns a 404 Not Found error. We mock the database response to return an empty array for the sightings query, simulating a scenario where no sighting is found with the given ID.
    it('returns 404 when sighting does not exist', async () => {
        limitMock.mockResolvedValueOnce([]);

        const { response, json } = await callGet({ id: 'missing-id', userId: 'user-1' });

        expect(response.status).toBe(404);
        expect(json).toEqual({ error: 'Sighting not found' });
        expect(selectMock).toHaveBeenCalledTimes(1);
        expect(limitMock).toHaveBeenCalledTimes(1);
    });

    // The fourth test checks that if the sighting exists but belongs to a different user than the authenticated user, the endpoint returns a 403 Forbidden error. We mock the database response to return a sighting with a userId that does not match the authenticated user's ID.
    it('returns 403 when sighting belongs to a different user', async () => {
        limitMock.mockResolvedValueOnce([
            {
                id: 'sighting-1',
                userId: 'different-user',
                species: 'Fox',
                description: 'Near trail',
                latitude: 45.12,
                longitude: -122.11,
                sightedAt: new Date('2026-03-21T12:34:56.000Z'),
                createdAt: new Date('2026-03-21T12:34:56.000Z'),
                updatedAt: new Date('2026-03-21T12:34:56.000Z')
            }
        ]);

        const { response, json } = await callGet({ id: 'sighting-1', userId: 'user-1' });

        expect(response.status).toBe(403);
        expect(json).toEqual({ error: 'Forbidden' });
        expect(selectMock).toHaveBeenCalledTimes(1);
        expect(limitMock).toHaveBeenCalledTimes(1);
    });

    // The fifth test checks that if the sighting exists and belongs to the authenticated user, the endpoint returns a 200 OK status with the sighting details. We mock the database response to return a sighting that matches the authenticated user's ID, and we also mock the images query to return a result indicating that an image is associated with the sighting. We verify that the response contains the correct sighting data and that the has_image field is set to true.
    it('returns 200 with mapped sighting data and has_image=true', async () => {
        const sightingRow = {
            id: 'sighting-1',
            userId: 'user-1',
            species: 'Bald Eagle',
            description: 'Near river',
            latitude: 45.123,
            longitude: -122.123,
            sightedAt: new Date('2026-03-21T12:34:56.000Z'),
            createdAt: new Date('2026-03-21T12:35:00.000Z'),
            updatedAt: new Date('2026-03-21T12:36:00.000Z')
        };

        // We mock the database responses for both the sightings query and the images query. The first call to limitMock simulates the response for the sightings query, returning a sighting that belongs to the authenticated user. The second call simulates the response for the images query, indicating that at least one image is associated with the sighting.
        limitMock
            .mockResolvedValueOnce([sightingRow]) // first query: sightings by id
            .mockResolvedValueOnce([{ id: 'img-1' }]); // second query: images existence

        const { response, json } = await callGet({ id: 'sighting-1', userId: 'user-1' });

        // We verify that the response status is 200 OK and that the JSON body contains the expected sighting details, including the has_image field set to true. We also check that the location field is correctly mapped from the description and that the timestamps are formatted as ISO strings.
        expect(response.status).toBe(200);
        expect(json).toEqual({
            id: 'sighting-1',
            animal_name: 'Bald Eagle',
            location: 'Near river',
            latitude: 45.123,
            longitude: -122.123,
            timestamp: sightingRow.sightedAt.toISOString(),
            has_image: true,
            created_at: sightingRow.createdAt.toISOString(),
            updated_at: sightingRow.updatedAt.toISOString()
        });

        expect(selectMock).toHaveBeenCalledTimes(2);
        expect(limitMock).toHaveBeenCalledTimes(2);
    });

    // The sixth test checks that if the sighting exists and belongs to the authenticated user, but there are no images associated with the sighting, the endpoint returns a 200 OK status with the sighting details and has_image set to false. We mock the database response for the sightings query to return a sighting that belongs to the authenticated user, and we mock the images query to return an empty array, indicating that no images are associated with the sighting. We verify that the response contains the correct sighting data and that the has_image field is set to false.
    it('returns 200 with has_image=false when no image exists', async () => {
        const sightingRow = {
            id: 'sighting-2',
            userId: 'user-1',
            species: 'Deer',
            description: null,
            latitude: 40,
            longitude: -70,
            sightedAt: new Date('2026-03-22T08:00:00.000Z'),
            createdAt: new Date('2026-03-22T08:00:00.000Z'),
            updatedAt: new Date('2026-03-22T08:00:00.000Z')
        };

        // We mock the database responses for both the sightings query and the images query. The first call to limitMock simulates the response for the sightings query, returning a sighting that belongs to the authenticated user. The second call simulates the response for the images query, returning an empty array to indicate that no images are associated with the sighting.
        limitMock
            .mockResolvedValueOnce([sightingRow]) // sightings query
            .mockResolvedValueOnce([]); // images query

        const { response, json } = await callGet({ id: 'sighting-2', userId: 'user-1' });

        // We verify that the response status is 200 OK and that the JSON body contains the expected sighting details, including the has_image field set to false. We also check that the location field is null (since description is null) and that the timestamps are formatted as ISO strings.
        expect(response.status).toBe(200);
        expect(json.has_image).toBe(false);
        expect(json.location).toBeNull();
    });
});