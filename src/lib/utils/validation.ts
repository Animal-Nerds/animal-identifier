// must be a valid email address
export function validateEmail(email: string): boolean {
    if (typeof email !== 'string')
        throw new TypeError('Email must be a string');
    const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9-]+.+.[A-Z]{2,4}/igm;
    return emailRegex.test(email);
}

// must contain at least one lowercase letter, one uppercase letter,
// one digit, one special character, and be at least 8 characters long
export function validatePassword(password: string): boolean {
    if (typeof password !== 'string')
        throw new TypeError('Password must be a string');
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

// cannot have anything except numbers, letters, underscores, and hyphens, and be between 3 and 20 characters long
export function validateUsername(username: string): boolean {
    if (typeof username !== 'string')
        throw new TypeError('Username must be a string');
    if (username.length < 3 || username.length > 20)
        return false;
    const usernameRegex = /^[a-zA-Z0-9_\-]+$/;
    return usernameRegex.test(username);
}

// must only contain letters and spaces, and be between 2 and 50 characters long
export function validateName(name: string): boolean {
    if (typeof name !== 'string')
        throw new TypeError('Name must be a string');
    if (name.length < 2 || name.length > 50)
        return false;
    const nameRegex = /^[a-zA-Z\s]+$/;
    return nameRegex.test(name);
}

import { users, type User } from '../db/schema';
export function validateUserObject(user: User): boolean {
    return validateObjectFromSchema(user, users);
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
): boolean {
    const schemaRecord = schema as unknown as Record<string, unknown>;
    const schemaEntries = Object.entries(schemaRecord)
        .filter((entry): entry is [string, PgColumn] => entry[1] instanceof PgColumn);

    for (const [key, column] of schemaEntries) {
        // ensure all keys in the schema are present in the object
        if (!(key in obj)) {
            throw new TypeError(`Field ${key} is missing from the object`);
        }

        if (!column.notNull && obj[key] === null)
            continue;
        const typeOfSchemaField = column.dataType;
        const typeOfObjField = typeof obj[key];
        if (!checkForType(obj[key], typeOfSchemaField, !column.notNull)) {
            throw new TypeError(`Type of field ${key} does not match schema. Expected ${typeOfSchemaField}, got ${typeOfObjField}`);
        }
    }
    return true;
}