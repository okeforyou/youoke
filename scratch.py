import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

api_req = urllib.request.Request(
    f"https://youtube-mp3-audio-video-downloader.p.rapidapi.com/get_m4a_download_link/9Ic6PWwTU8g",
    headers={
        'x-rapidapi-host': 'youtube-mp3-audio-video-downloader.p.rapidapi.com',
        'x-rapidapi-key': '25ac343bd9msh2fee41bd574ab7bp1f00fejsnd6ee8e4e096a',
        'User-Agent': 'Mozilla/5.0'
    }
)

try:
    with urllib.request.urlopen(api_req, context=ctx, timeout=30) as response:
        res_data = json.loads(response.read().decode('utf-8'))
        print(res_data)
except Exception as e:
    print(f"Error: {e}")
