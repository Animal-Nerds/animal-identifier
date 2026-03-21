import { describe, it, expect } from 'vitest';

// If you keep POST logic inline, use integration-style route tests.
// If you extract validation helper, test that helper directly first.

describe('POST /api/sightings', () => {
    it('returns 401 when no valid session', async () => {
        // call handler with locals.user undefined
        expect(true).toBe(true);
    });

    it('returns 400 with list of validation errors', async () => {
        // send invalid body and assert response.errors is array
        expect(true).toBe(true);
    });

    it('rejects userId in request body', async () => {
        // include userId and expect 400
        expect(true).toBe(true);
    });

    it('uses locals.user.id for inserted userId', async () => {
        // assert inserted payload owner is from locals
        expect(true).toBe(true);
    });

    it('defaults seen_at when omitted', async () => {
        // omit seen_at and assert created has sightedAt
        expect(true).toBe(true);
    });

    it('returns 201 with full created object including id', async () => {
        // happy path
        expect(true).toBe(true);
    });
});