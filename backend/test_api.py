#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:8080"

def test_health():
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"Health check: {response.status_code} - {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_generate():
    try:
        payload = {
            "user_id": "test_user",
            "session_id": "test_session_123",
            "message": "Create a cozy coffee shop photo with warm lighting",
            "content_type": "Post"
        }
        
        print("Sending generate request...")
        response = requests.post(
            f"{BASE_URL}/generate",
            json=payload,
            timeout=120  # Image generation can take time
        )
        
        print(f"Generate test: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Status: {data.get('status')}")
            print(f"Enhanced Prompt: {data.get('enhanced_prompt', '')[:200]}...")
            print(f"Caption: {data.get('caption')}")
            print(f"Hashtags: {data.get('hashtags')}")
            media_url = data.get('generated_media_url', '')
            if media_url.startswith('data:'):
                print(f"Media: Base64 image generated ({len(media_url)} chars)")
            else:
                print(f"Media URL: {media_url}")
        else:
            print(f"Error: {response.text}")
            
        return response.status_code == 200
    except Exception as e:
        print(f"Generate test failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing backend API...")
    print("=" * 50)
    
    if test_health():
        print("✅ Health check passed")
    else:
        print("❌ Health check failed")
        exit(1)
    
    print("=" * 50)
    
    if test_generate():
        print("✅ Generate test passed")
    else:
        print("❌ Generate test failed")