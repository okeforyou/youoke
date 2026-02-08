const fs = require('fs');
const zlib = require('zlib');

const key = Buffer.from([0xAF, 0xF2, 0x4C, 0x9C, 0xE9, 0xEA, 0x99, 0x43]);
const raw = fs.readFileSync('Demo Song/SX00143.emk');

console.log('Raw Length:', raw.length);

// Decrypt
const decrypted = Buffer.alloc(raw.length);
for (let i = 0; i < raw.length; i++) {
    decrypted[i] = raw[i] ^ key[i % key.length];
}

console.log('Decrypted Header (First 500 bytes):');
console.log(decrypted.slice(0, 500).toString('hex').match(/../g).join(' '));
console.log('Decrypted ASCII:', decrypted.slice(0, 500).toString('ascii').replace(/[^\x20-\x7E]/g, '.'));

// Try Inflate entire buffer
try {
    const inflated = zlib.inflateSync(decrypted);
    console.log('\nSUCCESS: Inflated!');
    console.log('Inflated Header:', inflated.slice(0, 500).toString('hex'));
} catch (e) {
    console.log('\nFAIL: Inflate failed:', e.message);

    // Try inflating from offset?
    // Maybe header is 16 bytes?
    try {
        const sliced = decrypted.slice(16);
        const inflated = zlib.inflateSync(sliced);
        console.log('SUCCESS: Inflated from offset 16!');
    } catch (e2) {
        console.log('FAIL: Inflate from offset 16 failed:', e2.message);
    }
}

// Search for Zlib Header (78 01, 78 9C, 78 DA)
console.log('\nScanning for Zlib header...');
let found = false;
for (let i = 0; i < decrypted.length - 2; i++) {
    if (decrypted[i] === 0x78 &&
        (decrypted[i + 1] === 0x01 || decrypted[i + 1] === 0x9C || decrypted[i + 1] === 0xDA)) {

        console.log(`Potential Zlib found at offset ${i} (0x${i.toString(16)})`);
        try {
            const sliced = decrypted.slice(i);
            const inflated = zlib.inflateSync(sliced);
            console.log(`✅ SUCCESS: Inflated from offset ${i}! Size: ${inflated.length}`);

            // Check for MThd in inflated
            const idx = inflated.indexOf('MThd', 0, 'ascii');
            if (idx !== -1) {
                console.log(`✅ FOUND MThd in Inflated at offset: ${idx}`);
                console.log('Valid MIDI found!');
                found = true;
                break;
            } else {
                console.log('⚠️ Inflated but NO MThd found.');
                // Dump first 16 bytes
                console.log('Header:', inflated.slice(0, 16).toString('hex'));
            }
        } catch (e) {
            // console.log(`Inflat failed at ${i}:`, e.message);
        }
    }
}

if (!found) {
    console.log('❌ Failed to find valid MIDI via Deep Scan.');
}

