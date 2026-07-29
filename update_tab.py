import re

with open("src/components/settings/tabs/AiSettingsTab.tsx", "r") as f:
    content = f.read()

# Add isMounted state to avoid hydration mismatch
new_content = re.sub(
    r"const \[isSaved, setIsSaved\] = useState\(false\);",
    r"const [isSaved, setIsSaved] = useState(false);\n    const [isMounted, setIsMounted] = useState(false);\n\n    useEffect(() => {\n        setIsMounted(true);\n    }, []);",
    content
)

# Modify the input to show empty or loading state before mount
new_content = re.sub(
    r"<input\s*type=\{showKey \? \"text\" : \"password\"\}\s*value=\{inputValue\}",
    r'<input \n                                        type={showKey ? "text" : "password"} \n                                        value={isMounted ? inputValue : ""}',
    new_content
)

with open("src/components/settings/tabs/AiSettingsTab.tsx", "w") as f:
    f.write(new_content)

print("Updated AiSettingsTab.tsx")
