def _safe_get(record, key, fallback=""):
	if not record:
		return fallback
	return record.get(key) or fallback


def build_prompt(candidate, req):
	"""
	Build a resilient prompt for Gemini. Any missing DB fields are replaced
	by friendly fallbacks so the AI call never crashes.
	"""
	candidate_name = _safe_get(candidate, "name", "Unknown Candidate")
	candidate_skills = _safe_get(candidate, "skills", "Not provided")
	candidate_experience = _safe_get(candidate, "experience", "Not provided")
	candidate_education = _safe_get(candidate, "education", "Not provided")

	req_title = _safe_get(req, "title", "Unknown Role")
	req_skills = (
		_safe_get(req, "skills_required")
		or _safe_get(req, "skills")
		or "Not provided"
	)
	req_experience = (
		_safe_get(req, "experience_required")
		or _safe_get(req, "experience")
		or "Not provided"
	)
	req_description = _safe_get(req, "description", "Not provided")

	return f"""
You are an AI recruiter. Evaluate the candidate against the requirement.
Base your judgement strictly on the provided data. Never hallucinate new facts.

Candidate:
Name: {candidate_name}
Skills: {candidate_skills}
Experience: {candidate_experience}
Education: {candidate_education}

Requirement:
Title: {req_title}
Skills Required: {req_skills}
Experience Needed: {req_experience}
Description: {req_description}

Return ONLY clean JSON:
{{
  "score": 85,
  "rationale": ["point 1", "point 2", "point 3"],
  "recommend": "SHORTLISTED|REJECTED|NEEDS_INTERVIEW",
  "red_flags": []
}}
""".strip()
def build_prompt(candidate, req):
    return f"""
You are an AI recruiter. Evaluate the candidate against the requirement.

Candidate:
Name: {candidate['name']}
Skills: {candidate['skills']}
Experience: {candidate['experience']}
Education: {candidate['education']}

Requirement:
Title: {req['title']}
Skills Required: {req['skills_required']}
Experience Needed: {req['experience_required']}

Return ONLY clean JSON:
{{
  "score": 85,
  "rationale": ["point 1", "point 2", "point 3"],
  "recommend": "SCREENED",
  "red_flags": []
}}
"""
