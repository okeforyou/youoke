import re
from datetime import datetime

with open('src/core/version.ts', 'r') as f:
    content = f.read()

new_version = "5.5.270"
today = datetime.now().strftime("%Y-%m-%d")

# Replace header version
content = re.sub(r'// 🛡️ v5\.5\.\d+:.*', f'// 🛡️ v{new_version}: Creator - All-in-One Editor Redesign (POC 1)', content, count=1)
content = re.sub(r'export const SYSTEM_VERSION = "5\.5\.\d+";', f'export const SYSTEM_VERSION = "{new_version}";', content, count=1)

# Add changelog
new_changelog = f"""    {{
        version: "{new_version}",
        date: "{today}",
        changes: [
            "ui(creator): Redesigned Creator Studio into an All-in-One Professional Editor format (POC 1).",
            "ui(creator): Replaced legacy purple theme with the system's primary dark/red unified color palette.",
            "feat(creator): Introduced an Empty State (Creator Hub) to centralize lyric import tools (Cloud, Paste, AI) when initializing a project.",
            "feat(creator): Consolidated timeline controls (Tap-to-sync, Ripple) into the bottom Timeline Toolbar to clear up Canvas space.",
            "feat(creator): Converted the Right Sidebar into a dedicated Properties Panel with new Fill and Highlight Color Pickers for text overlays."
        ]
    }},"""

content = re.sub(r'(export const CHANGELOGS = \[\n)', r'\1' + new_changelog + '\n', content, count=1)

with open('src/core/version.ts', 'w') as f:
    f.write(content)

print("Version bumped to 5.5.270")
