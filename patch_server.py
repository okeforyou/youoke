import re

with open('scripts/local-bridge/server.py', 'r') as f:
    content = f.read()

# Add global rapidapi_quota
if 'rapidapi_quota =' not in content:
    content = content.replace(
        'RAPIDAPI_KEY = ""',
        'RAPIDAPI_KEY = ""\nrapidapi_quota = {"remaining": None, "limit": None}'
    )

# Update health endpoint
health_func = """def health():
    device = "cuda" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu")
    return {"status": "ok", "message": "YouOke Local AI Bridge is running.", "device": device, "quota": rapidapi_quota}"""
content = re.sub(r'def health\(\):.*?return.*?\}', health_func, content, flags=re.DOTALL)

# Update rapidapi request
rapidapi_req = """                with urllib.request.urlopen(api_req, context=ctx, timeout=30) as response:
                    # Catch rate limit headers
                    global rapidapi_quota
                    remaining = response.getheader('x-ratelimit-requests-remaining')
                    limit = response.getheader('x-ratelimit-requests-limit')
                    if remaining is not None and limit is not None:
                        try:
                            rapidapi_quota['remaining'] = int(remaining)
                            rapidapi_quota['limit'] = int(limit)
                            print(f"[RapidAPI Quota] {remaining}/{limit}")
                        except ValueError:
                            pass

                    res_data = json.loads(response.read().decode('utf-8'))"""

content = re.sub(r'                with urllib\.request\.urlopen\(api_req, context=ctx, timeout=30\) as response:\n                    res_data = json\.loads\(response\.read\(\)\.decode\(\'utf-8\'\)\)', rapidapi_req, content)

with open('scripts/local-bridge/server.py', 'w') as f:
    f.write(content)
