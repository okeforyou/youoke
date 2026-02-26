/**
 * Sanitizes an object for Firebase by replacing 'undefined' values with 'null' 
 * or removing them, and stripping any incompatible types.
 * Firebase Realtime Database throws an error if 'undefined' is passed.
 */
export const sanitizeForFirebase = (obj: any): any => {
    if (obj === undefined) return null;
    if (obj === null || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeForFirebase(item));
    }

    const sanitized: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (value === undefined) {
                sanitized[key] = null; // or just skip: continue;
            } else if (value !== null && typeof value === 'object') {
                sanitized[key] = sanitizeForFirebase(value);
            } else {
                sanitized[key] = value;
            }
        }
    }
    return sanitized;
};
