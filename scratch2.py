import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(
    'https://s7.12388101.xyz/dl_9Ic6PWwTU8g-392c20cb548362392bf88498372e7bb21.m4a',
    headers={'User-Agent': 'Mozilla/5.0'}
)
with urllib.request.urlopen(req, context=ctx) as response, open('test.m4a', 'wb') as out_file:
    data = response.read()
    out_file.write(data)
print(f"Downloaded {len(data)} bytes")
