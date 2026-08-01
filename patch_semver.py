import re

with open("src/components/ListPlaylistsGrid.tsx", "r") as f:
    content = f.read()

# I will replace the simplistic check with a proper semver check
# Or I can just write a small helper function inside the file
# But actually, writing a robust check inline is better:

old_code = 'if (!verData.version || verData.version === "unknown" || verData.version < "1.0.44") isOutdated = true;'

new_code = '''
                if (!verData.version || verData.version === "unknown") {
                    isOutdated = true;
                } else {
                    const parts = verData.version.split('.').map(Number);
                    const req = [1, 0, 44];
                    for (let i = 0; i < 3; i++) {
                        if (parts[i] > req[i]) { isOutdated = false; break; }
                        if (parts[i] < req[i]) { isOutdated = true; break; }
                    }
                }
'''

content = content.replace(old_code, new_code.strip())

with open("src/components/ListPlaylistsGrid.tsx", "w") as f:
    f.write(content)
print("Patched ListPlaylistsGrid.tsx with robust semver check")
