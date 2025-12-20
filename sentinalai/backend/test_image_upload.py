#!/usr/bin/env python3
"""Test image upload and reference image processing"""
import requests
import base64
import json
from io import BytesIO

BASE_URL = "http://localhost:8080"

def create_real_test_image():
    """Create a real test image using PIL or download a sample"""
    try:
        # Try to use PIL to create a proper test image
        from PIL import Image
        
        # Create a 100x100 gradient image
        img = Image.new('RGB', (100, 100))
        pixels = img.load()
        for i in range(100):
            for j in range(100):
                pixels[i, j] = (255 - i*2, 100 + j, i + j)
        
        # Save to bytes
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=85)
        buffer.seek(0)
        return base64.b64encode(buffer.read()).decode('utf-8')
    except ImportError:
        # Fallback: download a sample image
        print("PIL not available, downloading sample image...")
        response = requests.get("https://picsum.photos/200/200", timeout=10)
        if response.status_code == 200:
            return base64.b64encode(response.content).decode('utf-8')
        return None

def test_with_reference_image():
    print("=" * 60)
    print("TESTING: Generate with Reference Image")
    print("=" * 60)
    
    # Create test image
    print("Creating test image...")
    test_image = create_real_test_image()
    
    if not test_image:
        print("❌ Could not create test image")
        return
    
    image_data_url = f"data:image/jpeg;base64,{test_image}"
    print(f"Test image data URL length: {len(image_data_url)}")
    
    payload = {
        "user_id": "test_user",
        "session_id": "test_image_upload_real",
        "message": "Create a similar style image but make it a beautiful sunset beach scene",
        "content_type": "Post",
        "image_data": image_data_url
    }
    
    print("\nSending request with reference image...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/generate",
            json=payload,
            timeout=120
        )
        
        print(f"Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Status: {data.get('status')}")
            print(f"Enhanced Prompt: {data.get('enhanced_prompt', '')[:200]}...")
            print(f"Caption: {data.get('caption', '')[:100]}...")
            
            media_url = data.get('generated_media_url', '')
            if media_url.startswith('data:'):
                print(f"Media: Base64 ({len(media_url)} chars)")
            else:
                print(f"Media URL: {media_url}")
            
            if data.get('status') == 'preview':
                print("\n✅ Image upload and generation successful!")
            else:
                print(f"\n❌ Generation failed: {data.get('error')}")
        else:
            print(f"❌ Request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_with_reference_image()
