import json

# Update package.json
with open('youoke-plugin/package.json', 'r') as f:
    data = json.load(f)
data['version'] = '1.0.50'
with open('youoke-plugin/package.json', 'w') as f:
    json.dump(data, f, indent=2)

# Update server.py
with open('scripts/local-bridge/server.py', 'r') as f:
    lines = f.readlines()
with open('scripts/local-bridge/server.py', 'w') as f:
    for line in lines:
        if line.startswith('VERSION = '):
            f.write('VERSION = "1.0.50"\n')
        else:
            f.write(line)
