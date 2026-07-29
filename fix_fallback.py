import re

with open("scripts/local-bridge/server.py", "r") as f:
    content = f.read()

# Reduce timeout for pytubefix to 30s
content = content.replace("PYTUBEFIX_TIMEOUT = 60", "PYTUBEFIX_TIMEOUT = 30")
# Reduce pytubefix client list to top 3 instead of 7
content = content.replace("['WEB_CREATOR', 'TV_EMBED', 'MWEB', 'IOS', 'ANDROID', 'WEB', 'TV']", "['WEB_CREATOR', 'IOS', 'ANDROID']")
# Reduce YTDLP_TIMEOUT to 45s
content = content.replace("YTDLP_TIMEOUT = 90", "YTDLP_TIMEOUT = 45")
# Reduce cookie_sources to top 2 instead of 4
content = content.replace('cookie_sources = [None, "chrome", "safari", "firefox"]', 'cookie_sources = [None, "chrome"]')

with open("scripts/local-bridge/server.py", "w") as f:
    f.write(content)

print("Optimized fallback timeouts")
