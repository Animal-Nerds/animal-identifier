import { VALIDATION } from './constants';

// helper function to return a ValidationResult object
const returnValidationResult = (errors: string[] = []): ValidationResult => ({
    valid: errors.length === 0,
    errors
});

// must be a valid email address
export function validateEmail(email: string): ValidationResult {
    let errors: string[] = [];
    if (typeof email !== 'string')
        errors.push('Email must be a string');
    const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9-]+.+.[A-Z]{2,4}/igm;
    if (!emailRegex.test(email))
        errors.push('Email is not valid');

    return returnValidationResult(errors);
}

// must contain at least one lowercase letter, one uppercase letter,
// one digit, one special character, and be at least 8 characters long
export function validatePassword(password: string): ValidationResult {
    let errors: string[] = [];
    if (typeof password !== 'string')
        errors.push('Password must be a string');
    const passwordRegex = new RegExp(`^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{${VALIDATION.PASSWORD.MIN_LENGTH},}$`);
    if (!passwordRegex.test(password))
        errors.push('Password is not valid');

    return returnValidationResult(errors);
}

// cannot have anything except numbers, letters, underscores, and hyphens, and be between 3 and 20 characters long
export function validateUsername(username: string): ValidationResult {
    let errors: string[] = [];
    if (typeof username !== 'string')
        errors.push('Username must be a string');
    if (username.length < VALIDATION.USERNAME.MIN_LENGTH || username.length > VALIDATION.USERNAME.MAX_LENGTH)
        errors.push(`Username must be between ${VALIDATION.USERNAME.MIN_LENGTH} and ${VALIDATION.USERNAME.MAX_LENGTH} characters long`);

    const usernameRegex = /^[a-zA-Z0-9_\-]+$/;
    if (!usernameRegex.test(username))
        errors.push('Username contains invalid characters');

    return returnValidationResult(errors);
}

// must only contain letters and spaces, and be between 2 and 50 characters long
export function validateName(name: string): ValidationResult {
    let errors: string[] = [];
    if (typeof name !== 'string')
        errors.push('Name must be a string');
    if (name.length < VALIDATION.NAME.MIN_LENGTH || name.length > VALIDATION.NAME.MAX_LENGTH)
        errors.push(`Name must be between ${VALIDATION.NAME.MIN_LENGTH} and ${VALIDATION.NAME.MAX_LENGTH} characters long`);

    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(name))
        errors.push('Name contains invalid characters');

    return returnValidationResult(errors);
}

export function validateUrl(url: string): ValidationResult {
    let errors: string[] = [];
    if (typeof url !== 'string')
        errors.push('URL must be a string');
    try {
        new URL(url);
        return returnValidationResult(errors);
    } catch {
        errors.push('URL is not valid');
        return returnValidationResult(errors);
    }
}

export function validateDate(val: Date): ValidationResult {
    let errors: string[] = [];
    if (!(val instanceof Date) || isNaN(val.valueOf()))
        errors.push('Value is not a valid date');
    return returnValidationResult(errors);
}

export function checkForType(value: any, expectedType: string, canBeNull: boolean): boolean {
    if (canBeNull && value === null)
        return true;
    if (expectedType === 'date')
        return value instanceof Date;
    return typeof value === expectedType;
}

import { type AnyPgTable, PgColumn } from 'drizzle-orm/pg-core';
export function validateObjectFromSchema<T extends Record<string, unknown>>(
    obj: T,
    schema: AnyPgTable
): ValidationResult {
    let errors: string[] = [];
    const schemaRecord = schema as unknown as Record<string, unknown>;
    const schemaEntries = Object.entries(schemaRecord)
        .filter((entry): entry is [string, PgColumn] => entry[1] instanceof PgColumn);

    for (const [key, column] of schemaEntries) {
        // ensure all keys in the schema are present in the object
        if (!(key in obj)) {
            errors.push(`Field ${key} is missing from the object`);
            continue;
        }

        if (!column.notNull && obj[key] === null)
            continue;
        const typeOfSchemaField = column.dataType;
        const typeOfObjField = typeof obj[key];
        if (!checkForType(obj[key], typeOfSchemaField, !column.notNull)) {
            errors.push(`Type of field ${key} does not match schema. Expected ${typeOfSchemaField}, got ${typeOfObjField}`);
        }
    }
    return returnValidationResult(errors);
}



import { users, type User } from '../db/schema';
export function validateUserObject(user: User): ValidationResult {
    let errors: string[] = [];
    errors.push(...validateObjectFromSchema(user, users).errors);
    errors.push(...validateEmail(user.email).errors);
    errors.push(...validateName(user.name).errors);
    if (user.avatarUrl !== null)
        errors.push(...validateUrl(user.avatarUrl).errors);
    errors.push(...validateDate(user.createdAt).errors);
    errors.push(...validateDate(user.updatedAt).errors);
    
    return returnValidationResult(errors);
}

import { sessions, type Session } from '../db/schema';
export function validateSessionObject(session: Session): ValidationResult {
    let errors: string[] = [];
    errors.push(...validateObjectFromSchema(session, sessions).errors);
    errors.push(...validateDate(session.expiresAt).errors);
    errors.push(...validateDate(session.createdAt).errors);

    return returnValidationResult(errors);
}

import { sightings, type Sighting } from '../db/schema';
export function validateSightingObject(sighting: Sighting): ValidationResult {
    let errors: string[] = [];
    errors.push(...validateObjectFromSchema(sighting, sightings).errors);
    errors.push(...validateDate(sighting.createdAt).errors);

    return returnValidationResult(errors);
}

import { images, type Image } from '../db/schema';
export function validateImageObject(image: Image): ValidationResult {
    let errors: string[] = [];
    errors.push(...validateObjectFromSchema(image, images).errors);
    errors.push(...validateUrl(image.url).errors);

    return returnValidationResult(errors);
}