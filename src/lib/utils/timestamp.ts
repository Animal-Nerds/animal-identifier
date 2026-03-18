
class Timestamp {
    static ensureValidDate(d: Date | string | null | undefined, quiet:boolean): Date {
        if (typeof quiet !== 'boolean')
            throw new TypeError('"quiet" must be of type: bool');
        if (!(d instanceof Date)) {
            if (d === null || d === undefined) {
                d = new Date();
            } else {
                const dateObj = new Date(d);
                if (isNaN(dateObj.valueOf())) {
                    if (quiet)
                        console.warn('d is not a valid date. Defaulting to now.');
                    else 
                        throw new TypeError('Date string is not a valid date.');
                    d = new Date();
                } else {
                    d = dateObj;
                }
            }
        }
        return d;
    }
    static toISO(d: Date | string | null, quietFail:boolean = true): string {
        d = this.ensureValidDate(d, quietFail);

        return d.toISOString();
    }
    static fromISO(s: string, quietFail:boolean = false): Date {
        if (typeof s !== 'string')
            throw new TypeError('fromISO must me given s of type: string');

        return this.ensureValidDate(s, quietFail);
    }
    static formatForDisplay(d:Date): string {
        d = this.ensureValidDate(d, false);

        return d.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
}

export { Timestamp };