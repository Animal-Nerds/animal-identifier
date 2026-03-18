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


describe('Timestamp.toISO', () => {
    it('given valid date should return same date as toISOString', () => {
        let d = new Date();
        expect(Timestamp.toISO(d, false))
            .toBe(d.toISOString());
    })
    it('valid date string should return date with same value', () => {
        let dStr = '2026-03-18T18:02:42.112Z';
        let d = new Date(dStr);
        expect(Timestamp.toISO(dStr, false))
            .toBe(d.toISOString());
    })
    it('null should return valid date', () => {
        expect(Timestamp.toISO(null, false))
            .toBeTypeOf('string')
    })
    it('undefined should return valid date', () => {
        expect(Timestamp.toISO(undefined, false))
            .toBeTypeOf('string')
    })
    
    it('invalid date string should return now if set to quiet mode', () => {
        expect(Timestamp.toISO('not-a-real-date', true))
            .toBeTypeOf('string')
    })
    it('invalid date string should throw an error if quiet mode is off', () => {
        expect(() => Timestamp.toISO('not-a-real-date', false))
            .toThrowError();
    })
})


describe('Timestamp.fromISO', () => {
    it('given valid ISO date string should return same date as new Date()', () => {
        let dStr = '2026-03-18T18:02:42.112Z';
        let d = new Date(dStr);
        expect(Timestamp.fromISO(dStr).getTime())
            .toBe(d.getTime());
    })
    it('null should throw error because not a string', () => {
        // @ts-ignore
        expect(() => Timestamp.fromISO(null))
            .toThrowError();
    })
    it('undefined should throw error because not a string', () => {
        // @ts-ignore
        expect(() => Timestamp.fromISO(undefined))
            .toThrowError();
    })
    it('invalid date string should throw an error if quiet mode is off', () => {
        expect(() => Timestamp.fromISO('not-a-real-date'))
            .toThrowError();
    })
})


describe('Timestamp.formatForDisplay', () => {
    it('given date should return formatted string for right time zone', () => {
        let d = new Date('2026-03-18T18:02:42.112Z');
        expect(Timestamp.formatForDisplay(d, 'UTC'))
            .toBe('Mar 18, 2026, 6:02 PM');
    })
    it('given date should return formatted string for right time zone', () => {
        let d = new Date('2026-03-18T18:02:42.112Z');
        expect(Timestamp.formatForDisplay(d, 'America/Denver'))
            .toBe('Mar 18, 2026, 12:02 PM');
    })
    it('null should throw error because not a date', () => {
        // @ts-ignore
        expect(() => Timestamp.formatForDisplay(null, 'UTC'))
            .toThrowError();
    })
    it('undefined should throw error because not a date', () => {
        // @ts-ignore
        expect(() => Timestamp.formatForDisplay(undefined, 'UTC'))
            .toThrowError();
    })
    it('string should throw an error', () => {
        // @ts-ignore
        expect(() => Timestamp.formatForDisplay('2026-03-18T18:02:42.112Z'))
            .toThrowError();
    })
})