with open("scripts/local-bridge/server.py", "r") as f:
    content = f.read()

old_key_line = 'RAPIDAPI_KEY = req.rapidapi_key or os.environ.get("RAPIDAPI_KEY", "25ac343bd9msh2fee41bd574ab7bp1f00fejsnd6ee8e4e096a")'
new_key_line = 'RAPIDAPI_KEY = req.rapidapi_key'

if old_key_line in content:
    content = content.replace(old_key_line, new_key_line)
    with open("scripts/local-bridge/server.py", "w") as f:
        f.write(content)
    print("Removed fallback key successfully.")
else:
    print("Could not find the target line.")
