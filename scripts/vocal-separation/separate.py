import os
import sys
import subprocess
import argparse

def separate_audio(input_file, output_dir):
    """
    Runs Demucs on the given input file and extracts vocals and no_vocals (instrumental).
    """
    if not os.path.exists(input_file):
        print(f"Error: File '{input_file}' not found.")
        sys.exit(1)

    print(f"Starting vocal separation for: {input_file}")
    print("This may take a few minutes depending on your computer's performance...")
    
    # Run demucs command
    # Using htdemucs_ft model which is fast and good quality
    cmd = [
        "python3", "-m", "demucs",
        "-n", "htdemucs_ft",
        "--two-stems=vocals",
        "-o", output_dir,
        input_file
    ]

    try:
        subprocess.run(cmd, check=True)
        print("\nSuccess! Separation completed.")
        print(f"The results are saved in the '{output_dir}/htdemucs_ft' folder.")
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
    parser = argparse.ArgumentParser(description="Separate vocals and music using Demucs")
    parser.add_argument("input_file", help="Path to the input audio file (e.g. song.mp3)")
    parser.add_argument("--output", default="separated_output", help="Output directory")
    
    args = parser.parse_args()
    
    separate_audio(args.input_file, args.output)
