import re

with open("src/core/version.ts", "r", encoding="utf-8") as f:
    code = f.read()

# Replace SYSTEM_VERSION
code = code.replace('export const SYSTEM_VERSION = "5.5.212";', 'export const SYSTEM_VERSION = "5.5.213";')

# Add changelog
new_changelog = """export const CHANGELOGS = [
    {
        version: "5.5.213",
        date: "2026-07-31",
        changes: [
            "feat(backend): Phase 1 of Universal Storage Engine implemented.",
            "feat(backend): youoke.json metadata generated for custom storage.",
            "feat(backend): Dynamic audio serving from custom_storage_path."
        ]
    },"""
    
code = code.replace("export const CHANGELOGS = [", new_changelog)

with open("src/core/version.ts", "w", encoding="utf-8") as f:
    f.write(code)
