#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:8080"

def test_video_generate():
    try:
        payload = {
            "user_id": "test_user",
            "session_id": "test_video_session",
            "message": "Create a short video of ocean waves at sunset",
            "content_type": "Reel"
        }
        
        print("Sending video generate request...")
        print("This may take a while...")
        response = requests.post(
            f"{BASE_URL}/generate",
            json=payload,
            timeout=300  # Video generation can take time
        )
        
        print(f"Generate test: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Status: {data.get('status')}")
            print(f"Enhanced Prompt: {data.get('enhanced_prompt', '')[:200]}...")
            print(f"Caption: {data.get('caption')}")
            print(f"Hashtags: {data.get('hashtags')}")
            media_url = data.get('generated_media_url', '')
            if media_url.startswith('data:video'):
                print(f"Media: Base64 video generated ({len(media_url)} chars)")
            elif media_url.startswith('data:'):
                print(f"Media: Base64 data ({len(media_url)} chars)")
            else:
                print(f"Media URL: {media_url}")
        else:
            print(f"Error: {response.text}")
            
        return response.status_code == 200
    except Exception as e:
        print(f"Generate test failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing Video Generation...")
    print("=" * 50)
    test_video_generate()
