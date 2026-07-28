const fs = require('fs');
const path = require('path');

const newVersion = process.argv[2];

if (!newVersion || !/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error("❌ กรุณาระบุเวอร์ชันใหม่ให้ถูกต้อง เช่น: node bump-version.js 1.0.33");
  process.exit(1);
}

const rootDir = path.join(__dirname, '..');

// 1. Update youoke-plugin/package.json
const packageJsonPath = path.join(rootDir, 'youoke-plugin', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  let pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log(`✅ อัปเดต Plugin package.json: ${pkg.version} -> ${newVersion}`);
  pkg.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
}

// 2. Update scripts/local-bridge/server.py
const serverPyPath = path.join(rootDir, 'scripts', 'local-bridge', 'server.py');
if (fs.existsSync(serverPyPath)) {
  let serverPy = fs.readFileSync(serverPyPath, 'utf8');
  const oldVersionMatch = serverPy.match(/VERSION\s*=\s*["']([^"']+)["']/);
  if (oldVersionMatch) {
    console.log(`✅ อัปเดต API server.py: ${oldVersionMatch[1]} -> ${newVersion}`);
    serverPy = serverPy.replace(/(VERSION\s*=\s*["'])([^"']+)["']/, `$1${newVersion}"`);
    fs.writeFileSync(serverPyPath, serverPy);
  }
}

// 3. Update src/components/ListPlaylistsGrid.tsx
const gridPath = path.join(rootDir, 'src', 'components', 'ListPlaylistsGrid.tsx');
if (fs.existsSync(gridPath)) {
  let gridContent = fs.readFileSync(gridPath, 'utf8');
  const oldVersionMatch = gridContent.match(/if \(verData\.version !== ["']([^"']+)["']\)/);
  if (oldVersionMatch) {
    console.log(`✅ อัปเดต Frontend ListPlaylistsGrid.tsx: ${oldVersionMatch[1]} -> ${newVersion}`);
    gridContent = gridContent.replace(/(if \(verData\.version !== ["'])([^"']+)["']\)/, `$1${newVersion}")`);
    fs.writeFileSync(gridPath, gridContent);
  }
}

console.log(`\n🎉 อัปเดตเวอร์ชัน ${newVersion} ทั้งโปรเจกต์สำเร็จแล้ว!`);
console.log(`อย่าลืม commit และ push โค้ดที่เปลี่ยน แล้วค่อยรันคำสั่ง build`);
