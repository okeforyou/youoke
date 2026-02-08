const fs = require('fs');
const path = require('path');

const libPath = path.join(__dirname, '../public/lib/spessasynth/index.js');

try {
    let content = fs.readFileSync(libPath, 'utf8');
    console.log("Reading file:", libPath);

    // Patch Imports
    // Replace 'from "spessasynth_core"' with 'from "./core.js"'
    // Regex for both single and double quotes
    const importRegex = /from\s+["']spessasynth_core["']/g;

    if (importRegex.test(content)) {
        content = content.replace(importRegex, 'from "./core.js"');
        console.log("✅ Patched 'spessasynth_core' imports to './core.js'");
    } else {
        console.log("⚠️ No 'spessasynth_core' imports found (already patched?)");
    }

    // Optional: Patch window usage to be safer?
    // Replace 'window.addEventListener' with 'self.addEventListener'
    const windowListener = "window.addEventListener";
    if (content.includes(windowListener)) {
        content = content.replace(new RegExp("window\\.addEventListener", 'g'), "self.addEventListener");
        console.log("✅ Patched 'window.addEventListener' to 'self.addEventListener'");
    }

    fs.writeFileSync(libPath, content, 'utf8');
    console.log("🎉 Lib patched successfully!");

} catch (err) {
    console.error("Error patching lib:", err);
    process.exit(1);
}
