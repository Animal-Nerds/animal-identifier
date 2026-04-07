import { describe, expect, it, vi, beforeEach } from 'vitest';

// ── DB mocks ────────────────────────────────────────────────────────────────

const limitMock = vi.fn();
const whereMock = vi.fn(() => ({ limit: limitMock }));
const fromMock = vi.fn(() => ({ where: whereMock }));
const selectMock = vi.fn(() => ({ from: fromMock }));

const returningMock = vi.fn();
const setWhereMock = vi.fn(() => ({ returning: returningMock }));
const setMock = vi.fn(() => ({ where: setWhereMock }));
const updateMock = vi.fn(() => ({ set: setMock }));

const deleteWhereMock = vi.fn();
const deleteMock = vi.fn(() => ({ where: deleteWhereMock }));

const valuesMock = vi.fn();
const insertMock = vi.fn(() => ({ values: valuesMock }));

vi.mock('$lib/db/client', () => ({
	db: {
		select: selectMock,
		update: updateMock,
		delete: deleteMock,
		insert: insertMock
	}
}));

const { PUT } = await import('./+server');

// ── Helpers ─────────────────────────────────────────────────────────────────

const baseSighting = {
	id: 'sighting-1',
	userId: 'user-1',
	species: 'Fox',
	description: 'Near trail',
	latitude: 45.12,
	longitude: -122.11,
	sightedAt: new Date('2026-03-21T12:00:00Z'),
	createdAt: new Date('2026-03-21T12:00:00Z'),
	updatedAt: new Date('2026-03-21T12:00:00Z'),
	isDeleted: false,
	imageUrl: 'https://example.com/fox.jpg'
};

function makeRequest(body: unknown) {
	return {
		params: { id: 'sighting-1' },
		locals: { user: { id: 'user-1' } },
		request: new Request('http://localhost/api/sightings/sighting-1', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		})
	} as never;
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('PUT /api/sightings/[id] — image handling', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('removes all images when images is an empty array', async () => {
		// Ownership check: sighting exists and belongs to user
		limitMock.mockResolvedValueOnce([baseSighting]);
		// After update, returning the updated row
		returningMock.mockResolvedValueOnce([
			{ ...baseSighting, imageUrl: null, updatedAt: new Date() }
		]);
		// Final image query returns nothing
		limitMock.mockResolvedValueOnce([]);

		const response = await PUT(makeRequest({ images: [] }));
		const json = await response.json();

		expect(response.status).toBe(200);
		// db.delete should have been called to remove old images
		expect(deleteMock).toHaveBeenCalled();
		// No new images inserted
		expect(insertMock).not.toHaveBeenCalled();
		// Response should have empty images and no imageUrl
		expect(json.images).toEqual([]);
		expect(json.imageUrl).toBeUndefined();
	});

	it('replaces images when a new images array is provided', async () => {
		limitMock.mockResolvedValueOnce([baseSighting]);
		returningMock.mockResolvedValueOnce([
			{ ...baseSighting, imageUrl: 'https://example.com/new.jpg', updatedAt: new Date() }
		]);
		limitMock.mockResolvedValueOnce([{ url: 'https://example.com/new.jpg' }]);

		const response = await PUT(
			makeRequest({ images: ['https://example.com/new.jpg'] })
		);
		const json = await response.json();

		expect(response.status).toBe(200);
		// Old images deleted
		expect(deleteMock).toHaveBeenCalled();
		// New image inserted
		expect(insertMock).toHaveBeenCalled();
		expect(valuesMock).toHaveBeenCalledWith({
			sightingId: 'sighting-1',
			url: 'https://example.com/new.jpg',
			order: 0
		});
		expect(json.images).toEqual(['https://example.com/new.jpg']);
		expect(json.imageUrl).toBe('https://example.com/new.jpg');
	});

	it('handles images as objects with url property', async () => {
		limitMock.mockResolvedValueOnce([baseSighting]);
		returningMock.mockResolvedValueOnce([
			{ ...baseSighting, imageUrl: 'https://example.com/obj.jpg', updatedAt: new Date() }
		]);
		limitMock.mockResolvedValueOnce([{ url: 'https://example.com/obj.jpg' }]);

		const response = await PUT(
			makeRequest({ images: [{ url: 'https://example.com/obj.jpg' }] })
		);
		const json = await response.json();

		expect(response.status).toBe(200);
		expect(insertMock).toHaveBeenCalled();
		expect(valuesMock).toHaveBeenCalledWith({
			sightingId: 'sighting-1',
			url: 'https://example.com/obj.jpg',
			order: 0
		});
		expect(json.imageUrl).toBe('https://example.com/obj.jpg');
	});

	it('does not touch images when images field is absent', async () => {
		limitMock.mockResolvedValueOnce([baseSighting]);
		returningMock.mockResolvedValueOnce([
			{ ...baseSighting, updatedAt: new Date() }
		]);
		limitMock.mockResolvedValueOnce([{ url: 'https://example.com/fox.jpg' }]);

		const response = await PUT(makeRequest({ species: 'Arctic Fox' }));
		const json = await response.json();

		expect(response.status).toBe(200);
		// Neither delete nor insert should be called for images
		expect(deleteMock).not.toHaveBeenCalled();
		expect(insertMock).not.toHaveBeenCalled();
		// Existing image preserved
		expect(json.imageUrl).toBe('https://example.com/fox.jpg');
	});
});
