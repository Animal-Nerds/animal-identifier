import { describe, it, expect } from 'vitest'
import { Timestamp } from './timestamp'

describe('Timestamp.ensureValidDate', () => {
    it('given valid date should return same date', () => {
        let d = new Date();
        expect(Timestamp.ensureValidDate(d, false).getTime())
            .toBe(d.getTime());
    })
    it('valid date string should return date with same value', () => {
        let dStr = '2026-03-18T18:02:42.112Z';
        let d = new Date(dStr);
        expect(Timestamp.ensureValidDate(dStr, false).getTime())
            .toBe(d.getTime());
    })
    it('null should return valid date', () => {
        expect(Timestamp.ensureValidDate(null, false))
            .toBeInstanceOf(Date)
    })
    it('undefined should return valid date', () => {
        expect(Timestamp.ensureValidDate(undefined, false))
            .toBeInstanceOf(Date)
    })
    
    it('invalid date string should return now if set to quiet mode', () => {
        expect(Timestamp.ensureValidDate('not-a-real-date', true))
            .toBeInstanceOf(Date)
    })
    it('invalid date string should throw an error if quiet mode is off', () => {
        expect(() => Timestamp.ensureValidDate('not-a-real-date', false))
            .toThrowError();
    })
})