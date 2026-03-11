import { describe, it, expect } from 'vitest'
import { validateEmail, validatePassword, validateUsername } from './validation'

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