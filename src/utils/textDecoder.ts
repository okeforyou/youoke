/**
 * textDecoder.ts
 * 
 * Specialized decoder for Thai Karaoke files (NCN/EMK).
 * Historical MIDI files often use TIS-620 (Windows-874) encoding for lyrics.
 * Modern browsers support 'windows-874' or 'tis-620' via TextDecoder.
 */

export const decodeThai = (buffer: Uint8Array | ArrayBuffer): string => {
    // 1. Try Native TIS-620 / Windows-874
    try {
        const decoder = new TextDecoder('windows-874');
        return decoder.decode(buffer);
    } catch (e) {
        console.warn("⚠️ TextDecoder 'windows-874' not supported, falling back to manual mapping or UTF-8");

        // 2. Fallback: UTF-8 (If the file is actually modern)
        try {
            const utf8 = new TextDecoder('utf-8', { fatal: true });
            return utf8.decode(buffer);
        } catch (utfErr) {
            // 3. Last Resort: Raw ASCII (will show gibberish for Thai)
            // 3. Last Resort: Raw ASCII
            return String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer)));
        }
    }
};

/**
 * Heuristic check if buffer contains Thai characters
 */
export const isThaiBuffer = (buffer: Uint8Array): boolean => {
    for (let i = 0; i < buffer.length; i++) {
        // Thai block in TIS-620 is mostly A1-DA (high bit set)
        if (buffer[i] >= 0xA1 && buffer[i] <= 0xDA) {
            return true;
        }
    }
    return false;
};
