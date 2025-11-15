import os
import json
from typing import Any, Dict

# Google Gemini API client wrapper. Requires GEMINI_API_KEY environment variable.
# Falls back to a safe mock response if API key is not configured.
# Get your API key from: https://aistudio.google.com/app/apikey


def call_llm(system: str, context: Dict[str, Any], user_message: str) -> str:

	# Get Gemini API key (required)
	api_key = os.getenv("GEMINI_API_KEY")
	
	# Gemini API configuration
	# Available Gemini models: gemini-2.5-flash (fast, free), gemini-1.5-pro (more capable), gemini-pro
	model = os.getenv("LLM_MODEL", "gemini-2.5-flash")
	
	# Gemini API endpoint format: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}
	api_url = f"https://generativelanguage.googleapis.com/v1/models/{model}:generateContent"


	if not api_key:
		# Safe deterministic mock: do not hallucinate; summarize only from context
		preview = json.dumps(context, default=str)
		preview = (preview[:800] + "...") if len(preview) > 800 else preview
		print("⚠️ LLM: No GEMINI_API_KEY configured, using mock response")
		return (
			"[Mocked AI Reply] Based only on provided ATS context and your question, "
			"here is a concise summary. If the requested data is missing, it may not "
			"exist or you are not authorized. Context preview: " + preview
		)

	# Gemini API call
	try:
		import requests  # type: ignore
		
		# Build the full prompt with system instructions, user message, and context
		full_prompt = f"{system}\n\nUser Question: {user_message}\n\nContext Data (JSON):\n{json.dumps(context, default=str, indent=2)}"
		
		# Gemini API payload format
		payload = {
			"contents": [
				{
					"parts": [
						{
							"text": full_prompt
						}
					]
				}
			],
			"generationConfig": {
				"temperature": 0.2,
				"maxOutputTokens": 2000,
			}
		}
		
		# Gemini API requires Content-Type header and API key as query parameter
		headers = {
			"Content-Type": "application/json",
		}
		params = {"key": api_key}
		
		print(f"🤖 LLM: Calling Gemini API with model {model}")
		print(f"🔑 API Key: {api_key[:10]}...{api_key[-5:] if len(api_key) > 15 else '***'}")
		resp = requests.post(api_url, json=payload, headers=headers, params=params, timeout=30)
		
		# Error handling
		if resp.status_code != 200:
			error_detail = resp.text
			print(f"❌ Gemini API Error ({resp.status_code}): {error_detail}")
			
			# Try to parse error message from response
			try:
				error_data = resp.json()
				error_msg = error_data.get("error", {}).get("message", error_detail)
				error_code = error_data.get("error", {}).get("code", "")
				
				print(f"   Error Code: {error_code}")
				print(f"   Error Message: {error_msg}")
				
				# Provide helpful suggestions for common errors
				if resp.status_code == 404:
					suggestion = (
						f"Model '{model}' not found. Try these Gemini models: "
						"gemini-2.5-flash (recommended, free), gemini-1.5-pro, or gemini-pro. "
						"Update LLM_MODEL in your config.env file."
					)
					return f"AI service error: {error_msg}\n\n{suggestion}"
				elif resp.status_code == 400:
					# Bad request - might be API key issue or model issue
					if "API key" in error_msg or "invalid" in error_msg.lower() or "key" in error_msg.lower():
						return f"AI service error: Invalid or missing API key. Please check your GEMINI_API_KEY in config.env. Error: {error_msg}. Get your key from https://aistudio.google.com/app/apikey"
					return f"AI service error: {error_msg}. Please check your request format."
				elif resp.status_code == 403:
					return f"AI service error: Access denied. Please check your GEMINI_API_KEY and ensure it's valid. Error: {error_msg}. Get your key from https://aistudio.google.com/app/apikey"
				else:
					return f"AI service error: {error_msg} (Code: {error_code}). Please check your API key and configuration."
			except Exception as parse_error:
				print(f"   Could not parse error response: {parse_error}")
				if resp.status_code == 404:
					return f"AI service error: HTTP 404 - Model '{model}' not found. Try: gemini-2.5-flash, gemini-1.5-pro, or gemini-pro. Raw error: {error_detail[:200]}"
				return f"AI service error: HTTP {resp.status_code} - {error_detail[:200]}"
		
		resp.raise_for_status()
		data = resp.json()
		
		# Parse Gemini response format
		# Gemini returns: {"candidates": [{"content": {"parts": [{"text": "..."}]}}]}
		candidates = data.get("candidates", [])
		if candidates:
			content = candidates[0].get("content", {})
			parts = content.get("parts", [])
			if parts:
				message = parts[0].get("text", "")
				if message:
					print("✅ LLM: Successfully received response from Gemini")
					return str(message)
		
		return "The AI did not return a response. Please try again."
		
	except requests.exceptions.RequestException as e:
		error_msg = str(e)
		print(f"❌ Gemini API Request Error: {error_msg}")
		return f"AI service connection error: {error_msg}. Please check your internet connection and Gemini API endpoint."
	except Exception as e:
		error_msg = str(e)
		print(f"❌ Gemini API Unexpected Error: {error_msg}")
		return f"AI service error: {error_msg}. Please contact support if this persists."


