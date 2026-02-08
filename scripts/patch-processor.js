const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../public/lib/spessasynth/spessasynth_processor.min.js');

try {
    let content = fs.readFileSync(filePath, 'utf8');
    console.log("Reading file:", filePath);

    // Patch 1: Correct the processor name
    const nameSearch = "spessasynth-worklet-processor";
    const nameReplace = "spessasynth-playback-worklet-processor";

    if (content.includes(nameSearch)) {
        content = content.replace(new RegExp(nameSearch, 'g'), nameReplace);
        console.log("✅ Patched processor name.");
    } else {
        console.log("⚠️ Processor name already patched or not found.");
    }

    // Patch 2: Handle Worker Null Message Handshake
    // Original: this.port.onmessage=a=>this.handleMessage(a.data)
    // Target: this.port.onmessage=a=>{if(!a.data&&a.ports[0]){let p=a.ports[0];p.onmessage=m=>this.handleMessage(m.data);return}this.handleMessage(a.data)}

    // We look for the exact minified string. It might vary slightly depending on build, but we know it's there.
    const handshakeSearch = "this.port.onmessage=a=>this.handleMessage(a.data)";
    const handshakeReplace = "this.port.onmessage=a=>{if(!a.data&&a.ports[0]){let p=a.ports[0];p.onmessage=m=>this.handleMessage(m.data);return}this.handleMessage(a.data)}";

    if (content.includes(handshakeSearch)) {
        content = content.replace(handshakeSearch, handshakeReplace);
        console.log("✅ Patched handshake logic.");
    } else if (content.includes("if(!a.data&&a.ports[0])")) {
        console.log("⚠️ Handshake logic already patched.");
    } else {
        console.error("❌ Could not find handshake logic to patch!");
        process.exit(1);
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log("🎉 File patched successfully!");

} catch (err) {
    console.error("Error patching file:", err);
    process.exit(1);
}
