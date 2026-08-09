import re

with open('src/pages/creator.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
toggle_play_count = 0
skip_mode = False
for line in lines:
    if "const togglePlay = () => {" in line:
        toggle_play_count += 1
        if toggle_play_count > 1:
            skip_mode = True
            continue
    
    if skip_mode:
        if "};" in line:
            skip_mode = False
        continue
    
    new_lines.append(line)

with open('src/pages/creator.tsx', 'w') as f:
    f.writelines(new_lines)
