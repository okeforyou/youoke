/**
 * 🛡️ stringUtils.ts: Aggressive Safety Guards for String Operations
 * v1.0.0 - Created to prevent recurring "TypeError: .split is not a function"
 */

/**
 * Safely splits a string with fallback to an empty array.
 * Guaranteed not to throw TypeError even if input is null, undefined, or non-string.
 */
export const safeSplit = (
    str: any, 
    separator: string | RegExp = " ", 
    fallback: string[] = []
): string[] => {
    if (typeof str !== 'string') {
        return fallback;
    }
    try {
        return str.split(separator);
    } catch (e) {
        console.warn("⚠️ safeSplit failed", e);
        return fallback;
    }
};

/**
 * Safely slices a string.
 */
export const safeSlice = (
    str: any, 
    start?: number, 
    end?: number, 
    fallback: string = ""
): string => {
    if (typeof str !== 'string') return fallback;
    try {
        return str.slice(start, end);
    } catch (e) {
        return fallback;
    }
};

/**
 * Safely trims a string.
 */
export const safeTrim = (str: any, fallback: string = ""): string => {
    if (typeof str !== 'string') return fallback;
    return str.trim();
};

/**
 * Safely checks if a string starts with another.
 */
export const safeStartsWith = (str: any, search: string): boolean => {
    if (typeof str !== 'string') return false;
    return str.startsWith(search);
};
/**
 * Safely parses artist names by removing parentheses suffix.
 * e.g., "Bodyslam (บอดี้สแลม)" -> "Bodyslam"
 */
export const safeArtistName = (name: any): string => {
    if (typeof name !== 'string') return "";
    const clean = name.includes(' (') ? name.split(' (')[0] : name;
    return clean.trim();
};
