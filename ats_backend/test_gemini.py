"""
Quick test script to verify Gemini API is working correctly.
Run this to test your GEMINI_API_KEY: python test_gemini.py
"""

import os
import json
import requests
from pathlib import Path

# Load environment variables
try:
    from dotenv import load_dotenv
    env_file = Path(__file__).parent / ".env"
    if not env_file.exists():
        env_file = Path(__file__).parent / "config.env"
    if env_file.exists():
        load_dotenv(dotenv_path=env_file, override=True)
        print(f"✅ Loaded environment from: {env_file.name}")
except ImportError:
    pass

api_key = os.getenv("GEMINI_API_KEY")
model = os.getenv("LLM_MODEL", "gemini-2.5-flash")

if not api_key:
    print("❌ Error: GEMINI_API_KEY not found in environment variables!")
    print("   Make sure it's set in config.env or .env file")
    exit(1)

print(f"🔑 Testing API Key: {api_key[:10]}...{api_key[-5:]}")
print(f"🤖 Model: {model}")
print()

# Test payload
api_url = f"https://generativelanguage.googleapis.com/v1/models/{model}:generateContent"
payload = {
    "contents": [
        {
            "parts": [
                {
                    "text": "Hello Gemini! Just say 'Hello' back to confirm the API is working."
                }
            ]
        }
    ],
    "generationConfig": {
        "temperature": 0.2,
        "maxOutputTokens": 100,
    }
}

headers = {
    "Content-Type": "application/json",
}
params = {"key": api_key}

try:
    print("📡 Sending request to Gemini API...")
    resp = requests.post(api_url, json=payload, headers=headers, params=params, timeout=30)
    
    print(f"📊 Status Code: {resp.status_code}")
    
    if resp.status_code == 200:
        data = resp.json()
        print("✅ SUCCESS! API is working correctly.")
        print()
        print("Response:")
        print(json.dumps(data, indent=2))
        print()
        
        # Extract text response
        candidates = data.get("candidates", [])
        if candidates:
            content = candidates[0].get("content", {})
            parts = content.get("parts", [])
            if parts:
                text = parts[0].get("text", "")
                print(f"💬 Gemini said: {text}")
    else:
        print(f"❌ ERROR: {resp.status_code}")
        print(f"Response: {resp.text}")
        
        # Try to parse error
        try:
            error_data = resp.json()
            error_msg = error_data.get("error", {}).get("message", resp.text)
            print(f"Error Message: {error_msg}")
            
            if resp.status_code == 400:
                if "API key" in error_msg or "invalid" in error_msg.lower():
                    print("\n💡 Tip: Check if your API key is correct and valid")
                    print("   Get a new key from: https://aistudio.google.com/app/apikey")
            elif resp.status_code == 403:
                print("\n💡 Tip: API key might be invalid or expired")
                print("   Get a new key from: https://aistudio.google.com/app/apikey")
        except:
            pass
            
except requests.exceptions.RequestException as e:
    print(f"❌ Network Error: {e}")
    print("   Check your internet connection")
except Exception as e:
    print(f"❌ Unexpected Error: {e}")

