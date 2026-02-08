import pako from 'pako';

export class EmkParser {

    private static EMK_KEY = new Uint8Array([
        0x41, 0x46, 0x46, 0x32, 0x2D, 0x58, 0x49, 0x4E, // AFF2-XIN
        0x53, 0x49, 0x4E, 0x47, 0x2D, 0x4D, 0x55, 0x53  // SING-MUS
    ]);

    static async parse(buffer: ArrayBuffer): Promise<{ midi: ArrayBuffer | null; error?: string }> {
        try {
            console.log("📂 Parsing potential EMK/NCN file...");
            const encrypted = new Uint8Array(buffer);

            // Strategy 1: Standard XOR
            const decryptedStandard = new Uint8Array(encrypted.length);
            for (let i = 0; i < encrypted.length; i++) {
                decryptedStandard[i] = encrypted[i] ^ this.EMK_KEY[i % this.EMK_KEY.length];
            }
            if (this.isMidi(decryptedStandard)) return { midi: decryptedStandard.buffer };

            // Strategy 2: Plain MIDI
            if (this.isMidi(encrypted)) return { midi: encrypted.buffer };

            // Strategy 3: Compressed
            try {
                const inflated = await this.tryInflate(decryptedStandard);
                if (this.isMidi(inflated)) return { midi: inflated.buffer };
            } catch (e) { }

            // Strategy 4: Split Key Recovery (Targeted)
            // Assumption: Structure is MThd(0) -> MTrk(14). Key changes at 14.
            if (encrypted.length > 20) {
                // 1. Derive Header Key (0-13)
                // MThd Signature (0-3) + Size (4-7)
                const headerKey = new Uint8Array(8);
                const mthdSig = [0x4D, 0x54, 0x68, 0x64];
                for (let i = 0; i < 4; i++) headerKey[i] = encrypted[i] ^ mthdSig[i];
                headerKey[4] = encrypted[4] ^ 0x00;
                headerKey[5] = encrypted[5] ^ 0x00;
                headerKey[6] = encrypted[6] ^ 0x00;
                headerKey[7] = encrypted[7] ^ 0x06;
                console.log("🔑 Header Key Derived:", headerKey);

                // 2. Derive Body Key (14-end)
                // We assume MTrk is at 14.
                // MTrk Signature (14-17) gives us BodyKey[0-3]
                // We need BodyKey[4-7]. We will brute force them based on MIDI Event Validity.
                const mtrkOffset = 14;
                const mtrkSig = [0x4D, 0x54, 0x72, 0x6B];
                const bodyKey = new Uint8Array(8);

                // Derive first half
                for (let i = 0; i < 4; i++) bodyKey[i] = encrypted[mtrkOffset + i] ^ mtrkSig[i];

                // Brute Force second half (Key[4]..Key[7])? 
                // Wait, if key is 8 bytes, we need to find 4 bytes (4 billion combinations? Too many).
                // NCN keys are usually 8 bytes looping.
                // Usually BodyKey[4-7] is related to BodyKey[0-3] or just simple.

                // OPTIMIZATION: Try reusing HeaderKey[4-7] first?
                // Test: Header Key Full?
                let bestKey = new Uint8Array(8);
                let bestScore = -1;

                // Let's try to brute force only 2 bytes if we assume Key[4,5] are 0/simple? No.
                // Let's brute force Key[6,7] and assume Key[4,5] are same as Header?
                // Or maybe Key[4,5] corresponds to Track Size. 
                // We can't know Track Size.

                // Revised Attack:
                // Scan for valid MIDI events in the first 200 bytes of Body.
                // We know Key[0,1,2,3].
                // We need Key[4,5,6,7].
                // That's 4 bytes = 4 billion. Too slow.

                // Alternative:
                // Look at the pattern of the Header Key.
                // Is it ASCII?
                // If so, we only check printable chars (32-126).

                // FAST TRACK: Try BodyKey = HeaderKey first.
                if (this.checkKeyScore(encrypted, mtrkOffset, headerKey) > 50) {
                    // It's just the header key.
                    console.log("🔓 Body Key is same as Header Key.");
                    bestKey.set(headerKey);
                    bestScore = 100;
                } else {
                    // Try modifying only the "Size" bytes (Key 4-7)?
                    // What if the key is just 8 bytes repeating from file start (Offset 0)?
                    // Then BodyKey accounts for offset alignment.
                    // The Brute Force loop we had was finding "Global Key".

                    // Let's try the "Winner-takes-all" scan again found something at 537.
                    // Maybe that WAS the track?

                    // Let's implement a lighter "Smart Recovery" for Key[6,7] only
                    // keeping Key[4,5] from HeaderKey?
                    // Or assume Key[4,5] = Key[0,1] (Mirroring)?

                    // Fallback Strategy:
                    // Brute force K6, K7 (65536) assuming K4=HeaderK4, K5=HeaderK5.
                    // This is fast enough (<100ms).
                    bodyKey[4] = headerKey[4];
                    bodyKey[5] = headerKey[5];

                    const result = this.bruteForceLastTwoBytes(encrypted, mtrkOffset, bodyKey);
                    if (result.score > 20) {
                        console.log("🔓 Recovered Key[6,7]. Score:", result.score);
                        bestKey.set(result.key);
                        bestScore = result.score;
                    }

                    // Try with K4,K5 from K0,K1
                    if (bestScore < 20) {
                        bodyKey[4] = bodyKey[0];
                        bodyKey[5] = bodyKey[1];
                        const res2 = this.bruteForceLastTwoBytes(encrypted, mtrkOffset, bodyKey);
                        if (res2.score > result.score) {
                            bestKey.set(res2.key);
                            bestScore = res2.score;
                        }
                    }
                }

                // Generate File
                const finalDec = new Uint8Array(encrypted.length);
                // Header (0-13)
                for (let i = 0; i < 14; i++) finalDec[i] = encrypted[i] ^ headerKey[i % 8];
                // Body (14-end)
                const finalBodyKey = (bestScore > 0) ? bestKey : headerKey;

                // Note: Body Key alignment.
                // If we derived from Offset 14. Key index 0 is at Offset 14.
                for (let i = 14; i < encrypted.length; i++) {
                    finalDec[i] = encrypted[i] ^ finalBodyKey[(i - 14) % 8];
                }

                // Fix Trace Header Count
                finalDec[10] = 0; finalDec[11] = 1;

                if (bestScore > 10 || this.isMidi(finalDec)) {
                    console.log("✨ Generated Fixed MIDI. Score: " + bestScore);
                    return { midi: finalDec.buffer };
                }
            }

            return { midi: null, error: "Could not decrypt EMK file (Unknown Algorithm)." };
        } catch (err: any) {
            console.error("EMK Parse Error:", err);
            return { midi: null, error: err.message };
        }
    }

    private static checkKeyScore(encrypted: Uint8Array, offset: number, key: Uint8Array): number {
        // ... (Simplified check)
        const sample = encrypted.slice(offset + 8, offset + 136); // Skip MTrk+Size
        let score = 0;
        for (let i = 0; i < sample.length; i++) {
            // Key alignment: offset+8+i represents byte at stream pos.
            // Key index: (8+i)%8
            const byte = sample[i] ^ key[(8 + i) % 8];
            // MIDI Status bytes are high score
            if ((byte & 0xF0) >= 0x80 && (byte & 0xF0) <= 0xE0) score += 3;
            if (byte === 0xFF) score += 2;
            if ((byte & 0x80) === 0 && byte < 128) score++; // Data byte
            else if (byte > 127 && (byte & 0xF0) < 0x80) score -= 5; // Invalid?
        }
        return score;
    }

    private static bruteForceLastTwoBytes(encrypted: Uint8Array, offset: number, baseKey: Uint8Array): { key: Uint8Array, score: number } {
        // ... implementation ...
        const start = offset + 8;
        const sampleLimit = Math.min(100, encrypted.length - start);
        const sample = encrypted.slice(start, start + sampleLimit);

        let bestScore = -1;
        let bestK6 = 0, bestK7 = 0;

        for (let k6 = 0; k6 < 256; k6++) {
            for (let k7 = 0; k7 < 256; k7++) {
                let score = 0;
                for (let i = 0; i < sample.length; i++) {
                    const kidx = (8 + i) % 8;
                    let k = baseKey[kidx];
                    if (kidx === 6) k = k6;
                    if (kidx === 7) k = k7;

                    const byte = sample[i] ^ k;
                    if ((byte & 0xF0) >= 0x80 && (byte & 0xF0) <= 0xEF) score += 3; // Status
                    if (byte === 0xFF) score += 3;
                    // Only punish bad high bits if not status
                    if ((byte & 0x80) && byte < 0x80) score -= 2;
                }
                if (score > bestScore) {
                    bestScore = score;
                    bestK6 = k6;
                    bestK7 = k7;
                }
            }
        }

        const newKey = new Uint8Array(baseKey);
        newKey[6] = bestK6;
        newKey[7] = bestK7;
        return { key: newKey, score: bestScore };
    }

    private static isMidi(buffer: Uint8Array): boolean {
        return (buffer[0] === 0x4D && buffer[1] === 0x54 && buffer[2] === 0x68 && buffer[3] === 0x64);
    }

    private static async tryInflate(input: Uint8Array): Promise<Uint8Array> {
        // ... (Keep existing)
        try { return pako.inflate(input); } catch (e) { }
        return input;
    }
}
