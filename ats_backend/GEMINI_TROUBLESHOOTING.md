# Gemini API Troubleshooting Guide

## Quick Test

Run the test script to verify your API key is working:
```bash
cd ats_backend
python test_gemini.py
```

## Common Issues & Solutions

### 1. "Invalid API key" or 400/403 Error

**Symptoms:**
- HTTP 400 or 403 status code
- Error message mentions "API key" or "invalid"

**Solutions:**
- ✅ Verify your API key starts with `AIza` (Gemini API keys start with this prefix)
- ✅ Make sure there are no extra spaces or quotes in `config.env`
- ✅ Get a fresh API key from: https://aistudio.google.com/app/apikey
- ✅ Ensure the API key is enabled for the Gemini API in Google Cloud Console

**Check your config.env:**
```
GEMINI_API_KEY=AIzaSyCPEMkXRCMYJ47t-GXdZyVOpuYqTj3OVGw
```
(No quotes, no spaces before/after)

### 2. "Model not found" or 404 Error

**Symptoms:**
- HTTP 404 status code
- Error mentions model name

**Solutions:**
- ✅ Use one of these valid model names:
  - `gemini-2.5-flash` (recommended, fastest)
  - `gemini-1.5-pro` (more capable)
  - `gemini-pro` (legacy)
- ✅ Check your `LLM_MODEL` in `config.env` matches exactly

### 3. "API key not found" in Python

**Symptoms:**
- Python says "No GEMINI_API_KEY configured"

**Solutions:**
- ✅ Make sure `config.env` or `.env` file exists in `ats_backend/` folder
- ✅ Restart your Flask server after changing config.env
- ✅ Verify `python-dotenv` is installed: `pip install python-dotenv`

### 4. Network/Connection Errors

**Symptoms:**
- Timeout errors
- Connection refused

**Solutions:**
- ✅ Check your internet connection
- ✅ Verify you can access: https://generativelanguage.googleapis.com
- ✅ Check if firewall/proxy is blocking the request
- ✅ Try increasing timeout in `llm_client.py` (currently 30 seconds)

## Testing Your API Key

### Method 1: Using the Test Script (Recommended)
```bash
cd ats_backend
python test_gemini.py
```

### Method 2: Using curl (Command Line)
```bash
curl -X POST \
  "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Hello Gemini!"
      }]
    }]
  }'
```

### Method 3: Using Python Directly
```python
import requests
import os

api_key = "YOUR_API_KEY"
url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={api_key}"

payload = {
    "contents": [{
        "parts": [{
            "text": "Hello Gemini!"
        }]
    }]
}

headers = {"Content-Type": "application/json"}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

## Verification Checklist

- [ ] API key is in `config.env` file
- [ ] API key starts with `AIza`
- [ ] No quotes around the API key value
- [ ] No extra spaces before/after the API key
- [ ] Flask server was restarted after changing config.env
- [ ] `python-dotenv` is installed
- [ ] Internet connection is working
- [ ] Model name is correct (gemini-2.5-flash, gemini-1.5-pro, or gemini-pro)

## Getting Help

If you're still having issues:
1. Run `python test_gemini.py` and share the full output
2. Check Flask server logs for detailed error messages
3. Verify your API key at: https://aistudio.google.com/app/apikey
4. Check Gemini API status: https://status.cloud.google.com/

## API Key Format

Valid Gemini API keys:
- ✅ Start with `AIza`
- ✅ Are about 39 characters long
- ✅ Example: `AIzaSyCPEMkXRCMYJ47t-GXdZyVOpuYqTj3OVGw`

Invalid formats:
- ❌ Keys starting with `gsk_` (those are Groq keys)
- ❌ Keys with spaces or quotes
- ❌ Keys that are too short or too long

