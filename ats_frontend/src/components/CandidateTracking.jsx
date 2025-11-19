import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  Users,
} from "lucide-react";

const stageTemplates = {
  IT: [
    "Screening",
    "HR Screening",
    "Technical Round 1",
    "Technical Round 2",
    "Manager Round",
    "Offer Discussion",
  ],
  "Non-IT": [
    "Screening",
    "HR Screening",
    "Aptitude Test",
    "Operations Round",
    "Final Manager Round",
    "Offer Released",
  ],
};

const API_BASE = "http://localhost:5000/api";

function StageTimeline({ category, currentStage }) {
  const stages = stageTemplates[category] || stageTemplates["IT"];
  const currentIndex = stages.indexOf(currentStage);

  return (
    <div className="flex flex-wrap items-center gap-4">
      {stages.map((stage, idx) => {
        const status =
          currentIndex === -1
            ? idx === 0
              ? "current"
              : "pending"
            : idx < currentIndex
            ? "completed"
            : idx === currentIndex
            ? "current"
            : "pending";

        return (
          <div key={stage} className="flex items-center gap-2">
            {status === "completed" && (
              <CheckCircle className="text-emerald-400 w-5 h-5" />
            )}
            {status === "current" && (
              <AlertTriangle className="text-purple-400 w-5 h-5 animate-pulse" />
            )}
            {status === "pending" && (
              <Clock className="text-gray-500 w-5 h-5" />
            )}

            <span
              className={`text-sm font-medium ${
                status === "completed"
                  ? "text-emerald-200"
                  : status === "current"
                  ? "text-purple-200"
                  : "text-gray-400"
              }`}
            >
              {stage}
            </span>

            {idx < stages.length - 1 && (
              <div className="w-8 h-px bg-gray-700" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CandidateTracking() {
  const { candidateId, requirementId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [selectedStage, setSelectedStage] = useState("");

  // -------------------------------------------------------------
  // LOAD CANDIDATE + REQUIREMENT + SCREENING + INTERVIEW DATA
  // -------------------------------------------------------------
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${API_BASE}/candidate-progress/${candidateId}/${requirementId}`
      );

      const payload = await res.json();
      if (!res.ok)
        throw new Error(payload.error || "Failed to load candidate progress");

      setData(payload);

      // default next stage → 2nd stage of template
      const defaultStage =
        (stageTemplates[payload.requirement?.category] ||
          stageTemplates["IT"])[1] || "";
      setSelectedStage(defaultStage);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [candidateId, requirementId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // -------------------------------------------------------------
  // SCREENING SUMMARY (SAFE PARSING)
  // -------------------------------------------------------------
  const screeningSummary = useMemo(() => {
    if (!data?.screening) return null;

    const safeParse = (value) => {
      try {
        const parsed = JSON.parse(value || "[]");
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [value];
      }
    };

    return {
      score: data.screening.ai_score,
      rationale: safeParse(data.screening.ai_rationale).filter(Boolean),
      redFlags: safeParse(data.screening.red_flags).filter(Boolean),
      recommend: data.screening.recommend,
    };
  }, [data]);

  // -------------------------------------------------------------
  // RECRUITER DECISION HANDLER
  // -------------------------------------------------------------
  const handleDecision = async (decision) => {
    try {
      setDecisionLoading(true);

      const body = {
        candidate_id: data.candidate.id,
        requirement_id: data.requirement.id,
        decision,
      };

      if (decision === "MOVE_NEXT") {
        if (!selectedStage) {
          alert("Select next stage first");
          setDecisionLoading(false);
          return;
        }
        body.next_stage = selectedStage;
      }

      const res = await fetch(`${API_BASE}/progress-decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = await res.json();
      if (!res.ok)
        throw new Error(payload.error || "Failed updating status");

      await fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setDecisionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // UI STATES
  // -------------------------------------------------------------
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-300">
        Loading candidate pipeline...
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-red-300">
        <p>{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-800 rounded-xl text-white"
        >
          Go Back
        </button>
      </div>
    );

  const category = data?.requirement?.category || "IT";
  const progress = data?.progress;
  const stageOptions = stageTemplates[category];
  const interviews = data?.interviews || [];

  const statusMapping = {
    REVIEW_REQUIRED: {
      label: "Manual Review",
      color: "text-amber-300 bg-amber-500/20",
    },
    REJECTED: {
      label: "Rejected",
      color: "text-red-300 bg-red-500/20",
    },
    IN_PROGRESS: {
      label: "In Progress",
      color: "text-emerald-300 bg-emerald-500/20",
    },
    COMPLETED: {
      label: "Completed",
      color: "text-cyan-300 bg-cyan-500/20",
    },
    PENDING: {
      label: "Pending",
      color: "text-gray-300 bg-gray-600/20",
    },
  };

  const statusMeta = statusMapping[progress?.status] || statusMapping.PENDING;

  // -------------------------------------------------------------
  // FULL UI BELOW
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ---------------------------------------------- */}
        {/* CANDIDATE + REQUIREMENT HEADER */}
        {/* ---------------------------------------------- */}
        <div className="bg-gray-900/70 border border-purple-500/30 rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-400">Candidate</p>
              <h1 className="text-3xl font-bold text-white">
                {data.candidate.name}
              </h1>
              <p className="text-gray-400 text-sm">
                {data.candidate.email} • {data.candidate.phone || "No phone"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-400">Requirement</p>
              <h2 className="text-2xl font-semibold text-white">
                {data.requirement.title}
              </h2>
              <p className="text-gray-400 text-sm">
                {data.requirement.location || "Remote"} • {category}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-400">Current Status</p>
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${statusMeta.color}`}
              >
                {statusMeta.label}
              </span>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------- */}
        {/* SCREENING SUMMARY */}
        {/* ---------------------------------------------- */}
        {screeningSummary && (
          <div className="bg-gray-900/70 border border-purple-500/30 rounded-2xl p-6 shadow-2xl space-y-4">

            {/* Score + Recommendation */}
            <div className="flex flex-wrap items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">AI Screening Score</p>
                <div className="text-3xl font-bold text-purple-300">
                  {screeningSummary.score}/100
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400">Recommendation</p>
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-sm font-semibold">
                  {screeningSummary.recommend}
                </span>
              </div>
            </div>

            {/* Rationale */}
            <div>
              <p className="text-sm text-gray-400 mb-2">Top Rationale</p>
              <ul className="space-y-1 text-gray-200 text-sm">
                {screeningSummary.rationale.length === 0
                  ? "No rationale provided"
                  : screeningSummary.rationale.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-purple-300 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
              </ul>
            </div>

            {/* Red Flags */}
            {screeningSummary.redFlags.length > 0 && (
              <div>
                <p className="text-sm text-red-300 mb-2">Red Flags</p>
                <ul className="space-y-1 text-red-200 text-sm">
                  {screeningSummary.redFlags.map((flag, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5" />
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------- */}
        {/* PIPELINE TIMELINE */}
        {/* ---------------------------------------------- */}
        <div className="bg-gray-900/70 border border-purple-500/30 rounded-2xl p-6 shadow-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">
              Pipeline Progress
            </h3>
            <span className="text-sm text-gray-400">
              Current Stage:{" "}
              <span className="text-purple-300 font-semibold">
                {progress?.current_stage || "Manual Review"}
              </span>
            </span>
          </div>

          <StageTimeline
            category={category}
            currentStage={progress?.current_stage}
          />
        </div>

        {/* ---------------------------------------------- */}
        {/* MANUAL DECISION BOX */}
        {/* ---------------------------------------------- */}
        <div className="bg-gray-900/70 border border-purple-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Manual Decision</h3>
              <p className="text-sm text-gray-400">
                AI never decides — recruiter must choose the next step.
              </p>
            </div>

            {/* Stage Selector */}
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="bg-gray-800 border border-purple-500/30 rounded-xl px-4 py-2 text-white"
              >
                {stageOptions.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>

              <button
                disabled={decisionLoading}
                onClick={() => handleDecision("MOVE_NEXT")}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white disabled:opacity-50"
              >
                Move to {selectedStage}
              </button>
            </div>
          </div>

          {/* Hold + Reject Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              disabled={decisionLoading}
              onClick={() => handleDecision("HOLD")}
              className="px-4 py-2 rounded-xl bg-yellow-500/20 text-yellow-200 border border-yellow-500/40 disabled:opacity-50"
            >
              Put On Hold
            </button>

            <button
              disabled={decisionLoading}
              onClick={() => handleDecision("REJECT")}
              className="px-4 py-2 rounded-xl bg-red-500/20 text-red-200 border border-red-500/40 disabled:opacity-50"
            >
              Reject Candidate
            </button>
          </div>
        </div>

        {/* ---------------------------------------------- */}
        {/* INTERVIEW TIMELINE */}
        {/* ---------------------------------------------- */}
        <div className="bg-gray-900/70 border border-purple-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Interview Timeline
            </h3>
            <span className="text-sm text-gray-400">
              {interviews.length} {interviews.length === 1 ? "event" : "events"}
            </span>
          </div>

          {interviews.length === 0 ? (
            <p className="text-gray-400 text-sm">
              No interviews yet. Candidate is waiting for your decision.
            </p>
          ) : (
            <div className="space-y-3">
              {interviews.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-purple-500/20 rounded-xl bg-gray-800/40 flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-white font-semibold">
                      {item.stage || "Stage TBD"}
                    </p>
                    <p className="text-gray-400 text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {item.date || "TBD"} • {item.time || "TBD"}
                    </p>
                  </div>

                  <div className="text-sm text-gray-400 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {item.interviewer || "Interviewer TBD"}
                  </div>

                  <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs">
                    {item.status || "Scheduled"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
