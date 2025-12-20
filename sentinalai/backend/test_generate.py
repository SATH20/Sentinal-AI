import requests
import json

def test_generate():
    payload = {
        "user_id": "test_user",
        "session_id": "test_session_123",
        "message": "Create a beautiful sunset photo for my travel blog",
        "content_type": "Post"
    }
    
    print("Testing /generate endpoint...")
    try:
        response = requests.post(
            "http://localhost:8080/generate",
            json=payload,
            timeout=60
        )
        
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        return data
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    test_generate()