import requests
import json

def test_simple_api():
    try:
        # Test health
        response = requests.get("http://localhost:8001/health", timeout=5)
        print(f"Health: {response.status_code} - {response.json()}")
        
        # Test chat
        payload = {
            "user_id": "test_user",
            "session_id": "test_session",
            "message": "Hello world"
        }
        
        response = requests.post("http://localhost:8001/chat", json=payload, timeout=5)
        print(f"Chat: {response.status_code} - {response.json()}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_simple_api()