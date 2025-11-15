from flask import Blueprint, request, jsonify
from utils.llm_client import call_llm
import json

jd_bp = Blueprint("jd_bp", __name__)

@jd_bp.route("/api/ai/jd-to-requirement", methods=["POST"])
def jd_to_requirement():
    try:
        data = request.get_json() or {}
        jd_text = data.get("jd_text", "")

        if not jd_text:
            return jsonify({"error": "jd_text is required"}), 400

        system_prompt = (
            "You are an ATS assistant. Extract structured information from "
            "the job description and return ONLY valid JSON (no markdown, no code blocks) with these exact fields: "
            "title, location, skills_required, experience_required, ctc_range, ectc_range, description. "
            "Return the JSON object directly, for example: "
            '{"title": "Software Engineer", "location": "Remote", "skills_required": "Python, React", "experience_required": "3-5 years", "ctc_range": "10-15 LPA", "ectc_range": "12-18 LPA", "description": "Job description here"}'
        )

        # call_llm signature: (system, context, user_message)
        llm_output = call_llm(system_prompt, {}, jd_text)
        
        # Try to parse JSON from LLM response (it might be wrapped in markdown or have extra text)
        try:
            # Remove markdown code blocks if present
            cleaned_output = llm_output.strip()
            if cleaned_output.startswith("```json"):
                cleaned_output = cleaned_output.replace("```json", "").replace("```", "").strip()
            elif cleaned_output.startswith("```"):
                cleaned_output = cleaned_output.replace("```", "").strip()
            
            # Find JSON object in the response
            start_idx = cleaned_output.find("{")
            end_idx = cleaned_output.rfind("}") + 1
            if start_idx >= 0 and end_idx > start_idx:
                json_str = cleaned_output[start_idx:end_idx]
                parsed_data = json.loads(json_str)
            else:
                parsed_data = json.loads(cleaned_output)
        except json.JSONDecodeError:
            # If parsing fails, return the raw output and let frontend handle it
            return jsonify({
                "suggested_requirement": {},
                "raw_output": llm_output,
                "error": "Could not parse JSON from AI response"
            }), 200

        return jsonify({"suggested_requirement": parsed_data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
