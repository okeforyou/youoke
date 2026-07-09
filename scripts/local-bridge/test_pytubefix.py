from pytubefix import YouTube
import sys

def test():
    yt_url = "https://www.youtube.com/watch?v=BaW_jenozKc"
    print("Fetching", yt_url)
    yt = YouTube(yt_url, use_oauth=True, allow_oauth_cache=True)
    ys = yt.streams.get_audio_only()
    print("Stream:", ys)
    ys.download(filename="test_pytubefix.m4a")
    print("Success")

if __name__ == "__main__":
    test()
