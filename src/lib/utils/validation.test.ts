import { describe, it, expect } from 'vitest'

import { validateEmail } from './validation'
describe('validateEmail', () => {
    it('should return true for a valid email', () => {
        expect(validateEmail('test@example.com')).toBe(true)
    })
    it('should return true for a valid email with extra characters', () => {
        expect(validateEmail('test.user@my-site.example.com')).toBe(true)
    })
    it('should return false for an invalid email', () => {
        expect(validateEmail('invalid-email')).toBe(false)
    })
    it('should throw a TypeError for a non-string input', () => {
        // @ts-ignore
        expect(() => validateEmail(123)).toThrow(TypeError)
    })
})


import { validatePassword } from './validation'
describe('validatePassword', () => {
    it('should return true for a valid password', () => {
        expect(validatePassword('Password123!')).toBe(true)
    })
    it('should return false for missing uppercase letter', () => {
        expect(validatePassword('password123!')).toBe(false)
    })
    it('should return false for missing lowercase letter', () => {
        expect(validatePassword('PASSWORD123!')).toBe(false)
    })
    it('should return false for missing number', () => {
        expect(validatePassword('Password!')).toBe(false)
    })
    it('should return false for missing special character', () => {
        expect(validatePassword('Password123')).toBe(false)
    })
    it('should return false for not meeting length requirement', () => {
        expect(validatePassword('Pass1!')).toBe(false)
    })
    it('should throw a TypeError for a non-string input', () => {
        // @ts-ignore
        expect(() => validatePassword(123)).toThrow(TypeError)
    })
})

import { validateUsername } from './validation'
describe('validateUsername', () => {
    it('should return true for a valid username', () => {
        expect(validateUsername('valid_username')).toBe(true)
    })
    it('should return false for a username that is too short', () => {
        expect(validateUsername('ab')).toBe(false)
    })
    it('should return false for a username that is too long', () => {
        expect(validateUsername('a'.repeat(21))).toBe(false)
    })
    it('should return false for a username with invalid characters', () => {
        expect(validateUsername('invalid@username')).toBe(false)
    })
    it('should throw a TypeError for a non-string input', () => {
        // @ts-ignore
        expect(() => validateUsername(123)).toThrow(TypeError)
    })
})

import { validateName } from './validation'
describe('validateName', () => {
    it('should return true for a valid name', () => {
        expect(validateName('John Doe')).toBe(true)
    })
    it('should return false for a name that is too short', () => {
        expect(validateName('J')).toBe(false)
    })
    it('should return false for a name that is too long', () => {
        expect(validateName('J'.repeat(51))).toBe(false)
    })
    it('should return false for a name with invalid characters', () => {
        expect(validateName('John_Doe')).toBe(false)
    })
    it('should throw a TypeError for a non-string input', () => {
        // @ts-ignore
        expect(() => validateName(123)).toThrow(TypeError)
    })
})

import { checkForType } from './validation'
describe('checkForType', () => {
    it('should return true for a valid string type', () => {
        expect(checkForType('hello', 'string', false)).toBe(true)
    })
    it('should return true for a valid number type', () => {
        expect(checkForType(123, 'number', false)).toBe(true)
    })
    it('should return true for a valid boolean type', () => {
        expect(checkForType(true, 'boolean', false)).toBe(true)
    })
    it('should return true for a valid date type', () => {
        expect(checkForType(new Date(), 'date', false)).toBe(true)
    })
    it('should return true for a null value when canBeNull is true', () => {
        expect(checkForType(null, 'string', true)).toBe(true)
    })
    it('should return true for a string value when canBeNull is true', () => {
        expect(checkForType('hello', 'string', true)).toBe(true)
    })
    it('should return false for a number value when canBeNull is true', () => {
        expect(checkForType(123, 'string', true)).toBe(false)
    })
    it('should return false for a null value when canBeNull is false', () => {
        expect(checkForType(null, 'string', false)).toBe(false)
    })
    it('should return false for an invalid type', () => {
        expect(checkForType(123, 'string', false)).toBe(false)
    })
})

import type { User } from '../db/schema';
import { validateUserObject } from './validation'
describe('validateUserObject', () => {
    it('should return true for a valid user object', () => {
        const user = {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'test@example.com',
            name: 'John Doe',
            avatarUrl: null,
            createdAt: new Date(),
            updatedAt: new Date()
        } as User;
        expect(validateUserObject(user)).toBe(true);
    });
});