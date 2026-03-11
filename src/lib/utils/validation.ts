




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

// cannot have anything except numbers, letters, underscores, and hyphens
export function validateUsername(username: string): boolean {
    if (typeof username !== 'string')
        throw new TypeError('Username must be a string');
    if (username.length < 3 || username.length > 20)
        return false;
    const usernameRegex = /^[a-zA-Z0-9_\-]+$/;
    return usernameRegex.test(username);
}