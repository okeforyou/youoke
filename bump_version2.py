import json

with open('youoke-plugin/package.json', 'r') as f:
    data = json.load(f)
data['version'] = '1.0.51'
with open('youoke-plugin/package.json', 'w') as f:
    json.dump(data, f, indent=2)

with open('scripts/local-bridge/server.py', 'r') as f:
    lines = f.readlines()
with open('scripts/local-bridge/server.py', 'w') as f:
    for line in lines:
        if line.startswith('VERSION = '):
            f.write('VERSION = "1.0.51"\n')
        else:
            f.write(line)
