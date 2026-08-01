with open("scripts/local-bridge/requirements.txt", "r") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.strip() == "torchcodec":
        continue # remove torchcodec
    new_lines.append(line)

new_lines.append("torch==2.3.1\n")
new_lines.append("torchaudio==2.3.1\n")

with open("scripts/local-bridge/requirements.txt", "w") as f:
    f.writelines(new_lines)
print("Updated requirements.txt")
