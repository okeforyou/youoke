import re

# Fix MainLayout.tsx
with open("src/layouts/MainLayout.tsx", "r") as f:
    content = f.read()

new_content = re.sub(
    r"<DebounceInput\s*minLength=\{2\}",
    r'<DebounceInput\n                            autoComplete="off"\n                            name="search"\n                            minLength={2}',
    content
)

with open("src/layouts/MainLayout.tsx", "w") as f:
    f.write(new_content)

# Fix AiSettingsTab.tsx
with open("src/components/settings/tabs/AiSettingsTab.tsx", "r") as f:
    content2 = f.read()

new_content2 = re.sub(
    r'<input \n                                        type=\{showKey \? "text" : "password"\}',
    r'<input \n                                        type={showKey ? "text" : "password"} \n                                        name="rapidapi-key"\n                                        autoComplete="new-password"',
    content2
)

with open("src/components/settings/tabs/AiSettingsTab.tsx", "w") as f:
    f.write(new_content2)

print("Fixed autofill")
