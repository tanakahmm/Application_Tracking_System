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
        cursor = conn.cursor(dictionary=True, buffered=True)

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

        _touch_candidate_progress(
            cursor,
            candidate_id,
            requirement["id"],
            requirement.get("category", "IT"),
            stage="Manual Review",
            status="REVIEW_REQUIRED",
            decision="NONE"
        )
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


@screening_bp.route("/create-interview", methods=["POST"])
def create_interview():
    try:
        data = request.json or {}
        required_fields = [
            "candidate_id",
            "requirement_id",
            "category",
            "stage",
            "date",
            "time",
            "duration",
            "mode",
            "interviewer",
        ]
        missing = [field for field in required_fields if not data.get(field)]
        if missing:
            return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        cursor = conn.cursor(dictionary=True, buffered=True)

        _ensure_screening_tables(cursor)

        cursor.execute("""
            INSERT INTO interviews
            (candidate_id, requirement_id, category, stage, date, time, duration, mode, location, interviewer, notes, status)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            data["candidate_id"],
            data["requirement_id"],
            data["category"],
            data["stage"],
            data["date"],
            data["time"],
            data["duration"],
            data["mode"],
            data.get("location", ""),
            data["interviewer"],
            data.get("notes", ""),
            data.get("status", "Scheduled")
        ))
        _touch_candidate_progress(
            cursor,
            data["candidate_id"],
            data["requirement_id"],
            data["category"],
            data["stage"],
            status="IN_PROGRESS",
            decision="MOVE_NEXT"
        )
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"status": "success"}), 201

    except Exception as e:
        print("❌ create_interview error:", e)
        return jsonify({"error": str(e)}), 500


@screening_bp.route("/interviews", methods=["GET"])
def get_interviews():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        cursor = conn.cursor(dictionary=True, buffered=True)

        _ensure_screening_tables(cursor)

        cursor.execute("""
            SELECT
                i.*,
                c.name AS candidate_name,
                c.email AS candidate_email,
                r.title AS requirement_title
            FROM interviews i
            LEFT JOIN candidates c ON c.id = i.candidate_id
            LEFT JOIN requirements r ON r.id = i.requirement_id
            ORDER BY i.date DESC, i.time DESC
        """)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(rows), 200
    except Exception as e:
        print("❌ get_interviews error:", e)
        return jsonify({"error": str(e)}), 500


@screening_bp.route("/update-stage", methods=["PUT"])
def update_stage():
    try:
        data = request.json or {}
        required_fields = ["interview_id", "stage", "candidate_id", "requirement_id"]
        missing = [field for field in required_fields if not data.get(field)]
        if missing:
            return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        cursor = conn.cursor(dictionary=True, buffered=True)

        _ensure_screening_tables(cursor)

        cursor.execute(
            "UPDATE interviews SET stage=%s WHERE id=%s",
            (data["stage"], data["interview_id"])
        )
        conn.commit()

        _touch_candidate_progress(
            cursor,
            data["candidate_id"],
            data["requirement_id"],
            data.get("category", "IT"),
            data["stage"],
            status="IN_PROGRESS",
            decision="MOVE_NEXT"
        )
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"status": "success"}), 200
    except Exception as e:
        print("❌ update_stage error:", e)
        return jsonify({"error": str(e)}), 500


@screening_bp.route("/progress-decision", methods=["POST"])
def recruiter_decision():
    try:
        body = request.json or {}
        candidate_id = body.get("candidate_id")
        requirement_ref = body.get("requirement_id")
        decision = (body.get("decision") or "").upper()
        next_stage = body.get("next_stage")

        if not candidate_id or not requirement_ref or decision not in {"MOVE_NEXT", "HOLD", "REJECT"}:
            return jsonify({"error": "candidate_id, requirement_id and valid decision are required"}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        cursor = conn.cursor(dictionary=True, buffered=True)

        _ensure_screening_tables(cursor)

        requirement = _resolve_requirement(cursor, requirement_ref)
        if not requirement:
            return jsonify({"error": "Requirement not found"}), 404

        if decision == "REJECT":
            cursor.execute("""
                UPDATE candidate_progress
                SET status='REJECTED', manual_decision='REJECT', current_stage='Rejected'
                WHERE candidate_id=%s AND requirement_id=%s
            """, (candidate_id, requirement["id"]))

        elif decision == "HOLD":
            cursor.execute("""
                UPDATE candidate_progress
                SET status='PENDING', manual_decision='HOLD', current_stage='On Hold'
                WHERE candidate_id=%s AND requirement_id=%s
            """, (candidate_id, requirement["id"]))

        elif decision == "MOVE_NEXT":
            if not next_stage:
                return jsonify({"error": "next_stage is required when decision is MOVE_NEXT"}), 400

            cursor.execute("""
                UPDATE candidate_progress
                SET status='IN_PROGRESS', manual_decision='MOVE_NEXT', current_stage=%s
                WHERE candidate_id=%s AND requirement_id=%s
            """, (next_stage, candidate_id, requirement["id"]))

            cursor.execute("""
                INSERT INTO interviews (candidate_id, requirement_id, category, stage, status)
                VALUES (%s,%s,%s,%s,'Scheduled')
            """, (candidate_id, requirement["id"], requirement.get("category", "IT"), next_stage))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"status": "updated"}), 200
    except Exception as e:
        print("❌ recruiter_decision error:", e)
        return jsonify({"error": str(e)}), 500


@screening_bp.route("/candidate-progress/<int:candidate_id>/<req_ref>", methods=["GET"])
def get_candidate_progress(candidate_id, req_ref):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500
        cursor = conn.cursor(dictionary=True, buffered=True)

        _ensure_screening_tables(cursor)

        cursor.execute("SELECT * FROM candidates WHERE id=%s", (candidate_id,))
        candidate = cursor.fetchone()
        if not candidate:
            return jsonify({"error": "Candidate not found"}), 404

        requirement = _resolve_requirement(cursor, req_ref)
        if not requirement:
            return jsonify({"error": "Requirement not found"}), 404

        cursor.execute("""
            SELECT *
            FROM candidate_progress
            WHERE candidate_id=%s AND requirement_id=%s
        """, (candidate_id, requirement["id"]))
        progress = cursor.fetchone()

        cursor.execute("""
            SELECT *
            FROM candidate_screening
            WHERE candidate_id=%s AND requirement_id=%s
            ORDER BY created_at DESC
            LIMIT 1
        """, (candidate_id, requirement["id"]))
        screening = cursor.fetchone()

        cursor.execute("""
            SELECT *
            FROM interviews
            WHERE candidate_id=%s AND requirement_id=%s
            ORDER BY date DESC, time DESC
        """, (candidate_id, requirement["id"]))
        interviews = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({
            "candidate": {
                "id": candidate["id"],
                "name": candidate.get("name"),
                "email": candidate.get("email"),
                "phone": candidate.get("phone"),
                "skills": candidate.get("skills"),
                "experience": candidate.get("experience"),
            },
            "requirement": {
                "id": requirement["id"],
                "title": requirement.get("title"),
                "category": requirement.get("category") or "IT",
                "location": requirement.get("location"),
            },
            "progress": progress,
            "screening": screening,
            "interviews": interviews,
        }), 200
    except Exception as e:
        print("❌ get_candidate_progress error:", e)
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

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS candidate_progress (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            candidate_id INT NOT NULL,
            requirement_id VARCHAR(64) NOT NULL,
            category VARCHAR(50),
            current_stage VARCHAR(50) DEFAULT 'Screening',
            status ENUM('PENDING','REVIEW_REQUIRED','REJECTED','IN_PROGRESS','COMPLETED') DEFAULT 'PENDING',
            manual_decision ENUM('NONE','MOVE_NEXT','HOLD','REJECT') DEFAULT 'NONE',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_progress (candidate_id, requirement_id),
            FOREIGN KEY (candidate_id) REFERENCES candidates(id),
            FOREIGN KEY (requirement_id) REFERENCES requirements(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS interviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            candidate_id INT NOT NULL,
            requirement_id VARCHAR(64) NOT NULL,
            category VARCHAR(50),
            stage VARCHAR(100),
            date DATE,
            time TIME,
            duration VARCHAR(50),
            mode VARCHAR(50),
            location VARCHAR(255),
            interviewer VARCHAR(255),
            notes TEXT,
            status VARCHAR(50) DEFAULT 'Scheduled',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (candidate_id) REFERENCES candidates(id),
            FOREIGN KEY (requirement_id) REFERENCES requirements(id)
        )
    """)


def _touch_candidate_progress(cursor, candidate_id, requirement_id, category, stage, status="PENDING", decision="NONE"):
    cursor.execute("""
        INSERT INTO candidate_progress (candidate_id, requirement_id, category, current_stage, status, manual_decision)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            category=VALUES(category),
            current_stage=VALUES(current_stage),
            status=VALUES(status),
            manual_decision=VALUES(manual_decision)
    """, (candidate_id, requirement_id, category or "IT", stage, status, decision or "NONE"))


def _resolve_requirement(cursor, identifier):
    if not identifier:
        return None

    cursor.execute("SELECT * FROM requirements WHERE id = %s",(str(identifier),))
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
