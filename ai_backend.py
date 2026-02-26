import os
import json
import time
import subprocess
from google import genai
from google.genai import types

# Configuration
API_KEY = "AIzaSyBFq2LIU2rcEKqWueiDP7NrGL-DU_EXNvo"
MODEL_ID = "gemini-3.1-pro-preview"
VIDEO_DRIVE_ID = "1qvpJEZTtMgDafrQWX5YKFGONPDShE52J"
VIDEO_FILENAME = "lesson1_temp.mp4"
OUTPUT_FILE = "ai_summaries.json"

PROMPT = """You are an elite Kizomba instructor and biomechanics expert analyzing this masterclass video ("Lesson 1 Body Movement"). 

Your task is to provide a chronologically ordered, highly detailed technical breakdown of the video's contents, driven entirely by timestamps. The timestamps should act as the primary bullet points for the analysis, highlighting key technique foundation moments, biomechanics, and musicality.

Structure the breakdown as a continuous list of timestamps. For each key moment or concept introduced in the video, provide the exact timestamp formatted strictly as `[MM:SS]`, followed by a bolded title for the movement/concept, and then a 2-4 sentence, highly technical explanation of the biomechanics, posture, or musicality being demonstrated.

**Formatting Example:**
- **[01:15]** - **Relaxed Knee Articulation**: Demonstration of the initial weight shift. Notice how the knees remain consistently soft to allow for a continuous, grounded flow. The core is engaged to stabilize the upper body while the lower body initiates movement.
- **[03:45]** - **Forward Progression & Ginga**: The transition from side-to-side grounding to forward progression. The weight is transferred smoothly through the entire foot, starting from the heel, rolling to the toe, which naturally creates the subtle hip sway characteristic of the dance.

**Requirements:**
- Do NOT use generic introductory or concluding AI phrases (e.g., "In this video...", "To summarize..."). Start immediately with the first timestamp.
- Speak directly to the student with authority and precision.
- Use precise anatomical and dance terminology (e.g., weight transfer, grounding, batida).
- The output must be entirely composed of these timestamped bullet points, capturing every significant instructional moment in the lesson."""

def download_video_from_drive():
    print(f"Downloading video {VIDEO_DRIVE_ID} from Google Drive...")
    # Use gdown to bypass virus scan warnings for large files
    try:
        import gdown
    except ImportError:
        print("Installing gdown...")
        subprocess.check_call(["pip", "install", "gdown"])
        import gdown
        
    url = f'https://drive.google.com/uc?id={VIDEO_DRIVE_ID}'
    gdown.download(url, VIDEO_FILENAME, quiet=False)
    print("Download complete.")

def process_video():
    if not os.path.exists(VIDEO_FILENAME):
        download_video_from_drive()
        
    print(f"Initializing Gemini Client with model {MODEL_ID}...")
    client = genai.Client(api_key=API_KEY)
    
    print("Uploading video to Gemini...")
    try:
        video_file = client.files.upload(file=VIDEO_FILENAME)
        print(f"Uploaded as: {video_file.name}")
        
        # Wait for video processing
        print("Waiting for video processing to complete...")
        while video_file.state == "PROCESSING":
            print(".", end="", flush=True)
            time.sleep(10)
            video_file = client.files.get(name=video_file.name)
            
        if video_file.state == "FAILED":
            raise Exception("Video processing failed.")
            
        print("\nVideo processing complete. Generating breakdown...")
        
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=[
                video_file,
                PROMPT
            ]
        )
        
        print("\n=== GENERATED BREAKDOWN ===")
        print(response.text)
        print("===========================\n")
        
        # Save to JSON
        save_to_json("1qvpJEZTtMgDafrQWX5YKFGONPDShE52J", response.text)
        
        # Cleanup
        print("Cleaning up uploaded file...")
        client.files.delete(name=video_file.name)
        
    except Exception as e:
        print(f"An error occurred: {e}")

def save_to_json(video_id, summary_text):
    data = {}
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, 'r') as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                data = {}
                
    data[video_id] = summary_text
    
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(data, f, indent=4)
        
    print(f"Summary saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    try:
        import google.genai
    except ImportError:
        print("Installing google-genai...")
        subprocess.check_call(["pip", "install", "google-genai"])
        
    process_video()