with open("src/modules/player/types.ts", "r") as f:
    content = f.read()
if "local" not in content:
    content = content.replace("export type SourceType = 'youtube' | 'midi' | 'vcd' | 'search' | 'youoke_ai';", "export type SourceType = 'youtube' | 'midi' | 'vcd' | 'search' | 'youoke_ai' | 'local';")
    with open("src/modules/player/types.ts", "w") as f:
        f.write(content)
