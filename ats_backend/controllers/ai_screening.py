from flask import Blueprint, request, jsonify
from utils.gemini import run_gemini_screening
from services.ai_data_service import get_db_connection
import requests
import json

screening_bp = Blueprint('screening', __name__, url_prefix="/api")


@screening_bp.route("/screen-candidate", methods=["POST"])
def screen_candidate():
    try:
        body = request.json or {}
        candidate_id = body.get("candidate_id")
        requirement_ref = body.get("requirement_id") or body.get("requirement_ref")

        if not candidate_id:
            return jsonify({"error": "candidate_id is required"}), 400
        if not requirement_ref:
            return jsonify({"error": "requirement identifier is required"}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        cursor = conn.cursor(dictionary=True)

        _ensure_screening_tables(cursor)

        cursor.execute("SELECT * FROM candidates WHERE id = %s", (candidate_id,))
        candidate = cursor.fetchone()

        requirement = _resolve_requirement(cursor, requirement_ref)

        if not candidate:
            return jsonify({"error": "Candidate not found"}), 404
        if not requirement:
            return jsonify({"error": "Requirement not found"}), 404

        ai_output = run_gemini_screening(candidate, requirement)
        normalized_output, normalize_error = _normalize_ai_output(ai_output)
        if normalize_error:
            return jsonify({"error": normalize_error, "raw_output": str(ai_output)}), 500

        cursor.execute("""
            INSERT INTO candidate_screening
            (candidate_id, requirement_id, ai_score, ai_rationale, recommend, red_flags, model_version)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            candidate_id,
            requirement["id"],
            normalized_output["score"],
            json.dumps(normalized_output["rationale"]),
            normalized_output["recommend"],
            json.dumps(normalized_output["red_flags"]),
            "gemini-2.5"
        ))
        conn.commit()

        cursor.execute("""
            INSERT INTO assesment_queue (candidate_id, requirement_id, status)
            VALUES (%s, %s, 'PENDING')
        """, (candidate_id, requirement["id"]))
        conn.commit()

        try:
            requests.post(
                "http://localhost:5678/webhook/screen_complete",
                json={
                    "candidate_id": candidate_id,
                    "requirement_id": requirement["id"],
                    "ai_score": normalized_output["score"],
                    "recommend": normalized_output["recommend"]
                },
                timeout=3
            )
        except requests.RequestException:
            print("⚠️ Could not send event to n8n (server offline).")

        cursor.close()
        conn.close()

        return jsonify({
            "message": "✅ Candidate screened successfully!",
            "result": normalized_output
        }), 200

    except Exception as e:
        print("❌ Screening error:", e)
        return jsonify({"error": str(e)}), 500


def _ensure_screening_tables(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS candidate_screening (
            id INT AUTO_INCREMENT PRIMARY KEY,
            candidate_id INT NOT NULL,
            requirement_id VARCHAR(64) NOT NULL,
            ai_score FLOAT,
            ai_rationale JSON,
            recommend VARCHAR(32),
            red_flags JSON,
            model_version VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (candidate_id) REFERENCES candidates(id),
            FOREIGN KEY (requirement_id) REFERENCES requirements(id)
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS assesment_queue (
            id INT AUTO_INCREMENT PRIMARY KEY,
            candidate_id INT NOT NULL,
            requirement_id VARCHAR(64) NOT NULL,
            status VARCHAR(32) DEFAULT 'PENDING',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (candidate_id) REFERENCES candidates(id),
            FOREIGN KEY (requirement_id) REFERENCES requirements(id)
        )
    """)


def _resolve_requirement(cursor, identifier):
    if not identifier:
        return None

    cursor.execute("SELECT * FROM requirements WHERE id = %s", (identifier,))
    row = cursor.fetchone()
    if row:
        return row

    cursor.execute(
        """
        SELECT * FROM requirements
        WHERE LOWER(title) = LOWER(%s)
        ORDER BY created_at DESC
        LIMIT 1
        """,
        (identifier,)
    )
    row = cursor.fetchone()
    if row:
        return row

    cursor.execute(
        """
        SELECT * FROM requirements
        WHERE LOWER(CONCAT(title, ' ', COALESCE(location, ''))) LIKE %s
        ORDER BY created_at DESC
        LIMIT 1
        """,
        (f"%{identifier.lower()}%",)
    )
    return cursor.fetchone()


def _normalize_ai_output(ai_output):
    if not isinstance(ai_output, dict):
        return None, "AI returned non-JSON output"

    if ai_output.get("error"):
        return None, ai_output.get("error")

    try:
        score = float(ai_output.get("score", 0))
    except (TypeError, ValueError):
        return None, "AI response missing numeric score"

    rationale = ai_output.get("rationale") or []
    if isinstance(rationale, str):
        rationale = [rationale]
    if not isinstance(rationale, list):
        rationale = [str(rationale)]

    red_flags = ai_output.get("red_flags") or []
    if isinstance(red_flags, str):
        red_flags = [red_flags]
    if not isinstance(red_flags, list):
        red_flags = [str(red_flags)]

    recommend = (ai_output.get("recommend") or "NEEDS_INTERVIEW").upper()
    if recommend not in {"SHORTLISTED", "REJECTED", "NEEDS_INTERVIEW"}:
        recommend = "NEEDS_INTERVIEW"

    return {
        "score": round(score, 2),
        "rationale": rationale,
        "red_flags": red_flags,
        "recommend": recommend
    }, None
