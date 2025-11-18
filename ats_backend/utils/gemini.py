import requests
import json
import os
import re
from utils.prompt_builder import build_prompt

# Load API key & model
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = os.getenv("LLM_MODEL", "gemini-2.5-flash")

# Correct Gemini 2.5 endpoint
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"


def extract_json(text: str):
    """Extract pure JSON from Gemini output (removes extra text)."""
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        raise ValueError("AI returned no valid JSON")
    return json.loads(match.group(0))


def run_gemini_screening(candidate, req):
    """Call Gemini for candidate screening and return parsed JSON."""
    
    # Build prompt safely
    prompt = build_prompt(candidate, req)

    payload = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ]
    }

    # Attach API key
    response = requests.post(
        f"{GEMINI_URL}?key={GEMINI_API_KEY}",
        json=payload,
        headers={"Content-Type": "application/json"}
    )

    # If Gemini fails
    if response.status_code != 200:
        return {
            "error": "Gemini API failed",
            "status": response.status_code,
            "raw_response": response.text
        }

    # Parse Gemini output
    data = response.json()

    try:
        text_output = data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        return {"error": f"Gemini output was not parseable: {e}", "raw": data}

    # Extract JSON inside the output
    try:
        return extract_json(text_output)
    except Exception as e:
        return {
            "error": f"Gemini returned invalid JSON: {e}",
            "raw_text": text_output
        }
