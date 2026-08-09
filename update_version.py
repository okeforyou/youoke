import json
import datetime
import re

with open('src/core/version.ts', 'r') as f:
    content = f.read()

new_version = "5.5.271"
new_date = "2026-08-09"

changes = [
    "feat(creator): Ported Studio Timeline to Creator Studio to provide identical block dragging, ripple edit, and inline editing UX.",
    "feat(creator): Redesigned Timeline Toolbar to center editing controls and reposition track selectors, mimicking the professional Studio layout."
]

changes_str = ",\n            ".join([f'"{c}"' for c in changes])

new_changelog = f"""    {{
        version: "{new_version}",
        date: "{new_date}",
        changes: [
            {changes_str}
        ]
    }},
"""

# Replace the first instance of `export const CHANGELOGS = [` with the new changelog
content = content.replace("export const CHANGELOGS = [", f"export const CHANGELOGS = [\n{new_changelog}")

# Update SYSTEM_VERSION
content = re.sub(r'export const SYSTEM_VERSION = ".*?";', f'export const SYSTEM_VERSION = "{new_version}";', content)

# Update first line comment
content = re.sub(r'// 🛡️ v5.5.270: Creator - All-in-One Editor Redesign \(POC 1\)', f'// 🛡️ v{new_version}: Creator - All-in-One Editor Redesign (POC 3)', content)

with open('src/core/version.ts', 'w') as f:
    f.write(content)
