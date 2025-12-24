#!/usr/bin/env python3
"""Test the full flow: generate -> approve -> publish"""
import requests
import json
import sys

BASE_URL = "http://localhost:8080"

def test_full_flow(content_type="Post"):
    print("=" * 60)
    print(f"TESTING FULL FLOW: Generate {content_type} -> Approve -> Publish")
    print("=" * 60)
    
    # Step 1: Generate content
    print(f"\n[1] Generating {content_type}...")
    generate_payload = {
        "user_id": "test_user",
        "session_id": f"test_full_flow_{content_type.lower()}",
        "message": "Beautiful sunset at the beach" if content_type == "Post" else "Ocean waves crashing at sunset",
        "content_type": content_type
    }
    
    response = requests.post(
        f"{BASE_URL}/generate",
        json=generate_payload,
        timeout=300  # Videos take longer
    )
    
    if response.status_code != 200:
        print(f"❌ Generate failed: {response.status_code}")
        return
    
    data = response.json()
    print(f"Status: {data.get('status')}")
    print(f"Content ID: {data.get('content_id')}")
    print(f"Caption: {data.get('caption', '')[:50]}...")
    
    media_url = data.get('generated_media_url', '')
    if media_url.startswith('data:video'):
        print(f"Media: Base64 VIDEO ({len(media_url)} chars)")
    elif media_url.startswith('data:image'):
        print(f"Media: Base64 IMAGE ({len(media_url)} chars)")
    else:
        print(f"Media URL: {media_url[:80]}...")
    
    content_id = data.get('content_id')
    if not content_id:
        print("❌ No content_id returned")
        return
    
    print(f"✅ {content_type} generated successfully!")
    
    # Step 2: Approve and publish
    print("\n[2] Approving and publishing...")
    approve_payload = {
        "user_id": "test_user",
        "session_id": f"test_full_flow_{content_type.lower()}",
        "content_id": content_id,
        "approved": True
    }
    
    response = requests.post(
        f"{BASE_URL}/approve",
        json=approve_payload,
        timeout=600  # Video publishing can take time
    )
    
    if response.status_code != 200:
        print(f"❌ Approve failed: {response.status_code}")
        print(response.text)
        return
    
    data = response.json()
    print(f"Status: {data.get('status')}")
    
    if data.get('status') == 'published':
        print(f"Post ID: {data.get('post_id')}")
        print(f"✅ {content_type} published successfully!")
    elif data.get('status') == 'error':
        print(f"Error: {data.get('error')}")
        print(f"❌ {content_type} publishing failed")
    else:
        print(f"Response: {data}")

if __name__ == "__main__":
    content_type = sys.argv[1] if len(sys.argv) > 1 else "Post"
    test_full_flow(content_type)
