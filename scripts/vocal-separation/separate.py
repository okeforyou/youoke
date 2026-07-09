import os
import sys
import subprocess
import argparse
import yt_dlp

def download_youtube_audio(url, output_dir):
    """
    Downloads audio from YouTube using yt-dlp.
    """
    print(f"Downloading audio from YouTube: {url}")
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    outtmpl = os.path.join(output_dir, 'youtube_download.%(ext)s')
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'outtmpl': outtmpl,
        'quiet': False
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
            return os.path.join(output_dir, 'youtube_download.mp3')
    except Exception as e:
        print(f"Error downloading from YouTube: {e}")
        sys.exit(1)

def separate_audio(input_file, output_dir):
    """
    Runs Demucs on the given input file and extracts vocals and no_vocals (instrumental).
    """
    if not os.path.exists(input_file):
        print(f"Error: File '{input_file}' not found.")
        sys.exit(1)

    print(f"Starting vocal separation for: {input_file}")
    print("This may take a few minutes depending on your computer's performance...")
    
    cmd = [
        sys.executable, "-m", "demucs",
        "-n", "htdemucs_ft",
        "--two-stems=vocals",
        "-o", output_dir,
        input_file
    ]

    try:
        subprocess.run(cmd, check=True)
        # Extract filename without extension to find the output folder
        filename_no_ext = os.path.splitext(os.path.basename(input_file))[0]
        result_dir = os.path.join(output_dir, 'htdemucs_ft', filename_no_ext)
        
        print("\nSuccess! Separation completed.")
        print(f"The results are saved in: {result_dir}")
        print("You will find 'vocals.wav' and 'no_vocals.wav' there.")
        print("Please copy those two files into the 'public/' folder of your Next.js project to test the PoC.")
    except subprocess.CalledProcessError as e:
        print(f"\nError running Demucs: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print("\nError: 'demucs' is not installed or not found in PATH.")
        print("Please install dependencies using: pip install -r requirements.txt")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Separate vocals and music from a local file or YouTube URL using Demucs")
    parser.add_argument("input", help="Path to the input audio file OR a YouTube URL")
    parser.add_argument("--output", default="separated_output", help="Output directory")
    
    args = parser.parse_args()
    
    # Check if input is a YouTube URL
    if args.input.startswith("http://") or args.input.startswith("https://"):
        download_dir = os.path.join(args.output, "downloads")
        input_file = download_youtube_audio(args.input, download_dir)
    else:
        input_file = args.input
        
    separate_audio(input_file, args.output)
