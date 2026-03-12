import { describe, it, expect } from 'vitest'

import { validateEmail } from './validation'
describe('validateEmail', () => {
    it('should return true for a valid email', () => {
        expect(validateEmail('test@example.com').valid).toBe(true)
    })
    it('should return true for a valid email with extra characters', () => {
        expect(validateEmail('test.user@my-site.example.com').valid).toBe(true)
    })
    it('should return false for an invalid email', () => {
        expect(validateEmail('invalid-email').valid).toBe(false)
    })
    it('should return false for a non-string input', () => {
        // @ts-ignore
        expect(validateEmail(123).valid).toBe(false)
    })
})


import { validatePassword } from './validation'
describe('validatePassword', () => {
    it('should return true for a valid password', () => {
        expect(validatePassword('Password123!').valid).toBe(true)
    })
    it('should return false for missing uppercase letter', () => {
        expect(validatePassword('password123!').valid).toBe(false)
    })
    it('should return false for missing lowercase letter', () => {
        expect(validatePassword('PASSWORD123!').valid).toBe(false)
    })
    it('should return false for missing number', () => {
        expect(validatePassword('Password!').valid).toBe(false)
    })
    it('should return false for missing special character', () => {
        expect(validatePassword('Password123').valid).toBe(false)
    })
    it('should return false for not meeting length requirement', () => {
        expect(validatePassword('Pass1!').valid).toBe(false)
    })
    it('should return false for a non-string input', () => {
        // @ts-ignore
        expect(validatePassword(123).valid).toBe(false)
    })
})

import { validateUsername } from './validation'
describe('validateUsername', () => {
    it('should return true for a valid username', () => {
        expect(validateUsername('valid_username').valid).toBe(true)
    })
    it('should return false for a username that is too short', () => {
        expect(validateUsername('ab').valid).toBe(false)
    })
    it('should return false for a username that is too long', () => {
        expect(validateUsername('a'.repeat(21)).valid).toBe(false)
    })
    it('should return false for a username with invalid characters', () => {
        expect(validateUsername('invalid@username').valid).toBe(false)
    })
    it('should return false for a non-string input', () => {
        // @ts-ignore
        expect(validateUsername(123).valid).toBe(false)
    })
})

import { validateName } from './validation'
describe('validateName', () => {
    it('should return true for a valid name', () => {
        expect(validateName('John Doe').valid).toBe(true)
    })
    it('should return false for a name that is too short', () => {
        expect(validateName('J').valid).toBe(false)
    })
    it('should return false for a name that is too long', () => {
        expect(validateName('J'.repeat(51)).valid).toBe(false)
    })
    it('should return false for a name with invalid characters', () => {
        expect(validateName('John_Doe').valid).toBe(false)
    })
    it('should return false for a non-string input', () => {
        // @ts-ignore
        expect(validateName(123).valid).toBe(false)
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
        expect(validateUserObject(user).valid).toBe(true);
    });
});

import type { Session } from '../db/schema';
import { validateSessionObject } from './validation'
describe('validateSessionObject', () => {
    it('should return true for a valid session object', () => {
        const session = {
            id: '123e4567-e89b-12d3-a456-426614174000',
            userId: '123e4567-e89b-12d3-a456-426614174000',
            token: 'some-random-token',
            expiresAt: new Date(Date.now() + 1000 * 60 * 60), // expires in 1 hour
            createdAt: new Date()
        } as Session;
        expect(validateSessionObject(session).valid).toBe(true);
    });
});


import type { Sighting } from '../db/schema';
import { validateSightingObject } from './validation'
describe('validateSightingObject', () => {
    it('should return true for a valid sighting object', () => {
        const sighting = {
            id: '123e4567-e89b-12d3-a456-426614174000',
            userId: '123e4567-e89b-12d3-a456-426614174000',
            species: 'Bald Eagle',
            description: 'Spotted near the river',
            latitude: 45.123456,
            longitude: -122.123456,
            sightedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        } as Sighting;
        expect(validateSightingObject(sighting).valid).toBe(true);
    });
});


import type { Image } from '../db/schema';
import { validateImageObject } from './validation'
describe('validateImageObject', () => {
    it('should return true for a valid image object', () => {
        const image = {
            id: '123e4567-e89b-12d3-a456-426614174000',
            sightingId: '123e4567-e89b-12d3-a456-426614174000',
            url: 'https://example.com/image.jpg',
            altText: 'A photo of a bald eagle',
            order: 1,
            createdAt: new Date()
        } as Image;
        expect(validateImageObject(image).valid).toBe(true);
    });
});