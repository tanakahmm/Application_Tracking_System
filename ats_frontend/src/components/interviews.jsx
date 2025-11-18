// src/components/Interviews.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  Video,
  FileText,
  CircleDot,
} from "lucide-react";

/* ============================================================
  IT + NON-IT STAGE TEMPLATES
============================================================ */
const stageTemplates = {
  IT: [
    "Screening",
    "HR Round",
    "Technical Round 1",
    "Technical Round 2",
    "Manager Round",
    "Offer Discussion",
  ],
  "Non-IT": [
    "Application Received",
    "HR Screening",
    "Aptitude Test",
    "Background Verification",
    "Final Manager Round",
    "Offer Released",
  ],
};

/* ============================================================
  InterviewTracker - shows progress based on category & stage
============================================================ */
function InterviewTracker({ category = "Non-IT", currentStage = "" }) {
  const stages = stageTemplates[category] || stageTemplates["Non-IT"];
  const currentIndex = Math.max(0, stages.indexOf(currentStage));

  const getStatus = (idx) => {
    if (idx < currentIndex) return "completed";
    if (idx === currentIndex) return "current";
    return "pending";
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow mt-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Interview Progress ({category})
      </h3>

      <div className="flex flex-wrap items-center gap-4">
        {stages.map((stage, idx) => {
          const status = getStatus(idx);
          return (
            <div key={stage} className="flex items-center gap-2">
              {/* icon */}
              {status === "completed" && (
                <CheckCircle className="text-green-600 w-5 h-5" />
              )}
              {status === "current" && (
                <CircleDot className="text-blue-600 w-5 h-5 animate-pulse" />
              )}
              {status === "pending" && (
                <Clock className="text-gray-400 w-5 h-5" />
              )}

              {/* label */}
              <span
                className={`text-sm font-medium ${
                  status === "completed"
                    ? "text-green-700"
                    : status === "current"
                    ? "text-blue-700"
                    : "text-gray-500"
                }`}
              >
                {stage}
              </span>

              {/* connector */}
              {idx < stages.length - 1 && (
                <div className="w-8 h-1 bg-gray-200 rounded" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const API_BASE = "http://localhost:5000/api";

function ScheduleInterviewForm({
  onClose,
  onSubmit,
  candidateOptions,
  requirementOptions,
}) {
  const [formData, setFormData] = useState({
    candidate_id: "",
    requirement_id: "",
    category: "",
    stage: "",
    date: "",
    time: "",
    duration: "",
    mode: "",
    location: "",
    interviewer: "",
    notes: "",
    status: "Scheduled",
  });

  // Keep stage options dynamic based on selected category
  const availableStages =
    (formData.category && stageTemplates[formData.category]) ||
    stageTemplates["Non-IT"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "category") {
      setFormData({ ...formData, category: value, stage: "" });
      return;
    }
    if (name === "requirement_id") {
      const selectedReq = requirementOptions.find((req) => String(req.id) === value);
      setFormData({
        ...formData,
        requirement_id: value,
        category: selectedReq?.category || formData.category || "IT",
      });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const selectedRequirement = requirementOptions.find(
    (req) => String(req.id) === String(formData.requirement_id)
  );

  const selectedCandidate = candidateOptions.find(
    (cand) => String(cand.id) === String(formData.candidate_id)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !formData.candidate_id ||
      !formData.requirement_id ||
      !formData.category ||
      !formData.stage ||
      !formData.date ||
      !formData.time ||
      !formData.duration ||
      !formData.mode ||
      !formData.interviewer
    ) {
      alert("Please fill all required fields");
      return;
    }

    onSubmit({
      ...formData,
      requirement_id: Number(formData.requirement_id),
      candidate_id: Number(formData.candidate_id),
      requirement_title: selectedRequirement?.title,
      candidate_name: selectedCandidate?.name,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 w-full max-w-3xl rounded-2xl border border-purple-500/30 shadow-2xl overflow-auto max-h-[90vh]">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gradient">Schedule Interview</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Candidate *
                </label>
                <select
                  name="candidate_id"
                  value={formData.candidate_id}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-purple-500/30 rounded-xl px-3 py-2 mt-1 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select candidate</option>
                  {candidateOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Requirement *
                </label>
                <select
                  name="requirement_id"
                  value={formData.requirement_id}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-purple-500/30 rounded-xl px-3 py-2 mt-1 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select requirement</option>
                  {requirementOptions.map((req) => (
                    <option key={req.id} value={req.id}>
                      {req.title} ({req.location || "Remote"})
                    </option>
                  ))}
                </select>
                {selectedRequirement && (
                  <p className="text-xs text-gray-400 mt-1">
                    Selected role: {selectedRequirement.title}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Requirement Type *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-purple-500/30 rounded-xl px-3 py-2 mt-1 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Type</option>
                  <option value="IT">IT</option>
                  <option value="Non-IT">Non-IT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Interview Stage *
                </label>
                <select
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-purple-500/30 rounded-xl px-3 py-2 mt-1 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Stage</option>
                  {availableStages.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-purple-500/30 rounded-xl px-3 py-2 mt-1 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Time *
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-purple-500/30 rounded-xl px-3 py-2 mt-1 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  min="1"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-purple-500/30 rounded-xl px-3 py-2 mt-1 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Mode *
                </label>
                <select
                  name="mode"
                  value={formData.mode}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-purple-500/30 rounded-xl px-3 py-2 mt-1 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Mode</option>
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                  <option value="Telephonic">Telephonic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  {formData.mode === "Online"
                    ? "Meeting Link"
                    : formData.mode === "Offline"
                    ? "Office Location"
                    : formData.mode === "Telephonic"
                    ? "Contact Number"
                    : "Location / Link"}
                </label>
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-purple-500/30 rounded-xl px-3 py-2 mt-1 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={
                    formData.mode === "Online"
                      ? "Zoom / Google Meet link"
                      : formData.mode === "Offline"
                      ? "Office address"
                      : formData.mode === "Telephonic"
                      ? "Phone number"
                      : "Provide meeting details"
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Interviewer(s) *
                </label>
                <input
                  name="interviewer"
                  value={formData.interviewer}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-purple-500/30 rounded-xl px-3 py-2 mt-1 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Interviewer name(s)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full bg-gray-800 border border-purple-500/30 rounded-xl px-3 py-2 mt-1 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-purple-500/30 rounded-xl px-3 py-2 mt-1 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows="3"
                placeholder="Any extra instructions or notes"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-purple-500/30 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/40"
              >
                Save Interview
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
  InterviewCard (single item)
============================================================ */
function InterviewCard({ interview, editingId, setEditingId, updateStage }) {
  return (
    <div className="bg-gray-800/40 border border-purple-500/30 rounded-2xl p-5 hover:border-purple-400/60 transition my-4 shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-3 text-white">
            {interview.candidate_name || "Candidate"}
            <span className="px-2 py-1 text-sm bg-blue-500/20 text-blue-200 rounded border border-blue-400/40">
              {interview.status}
            </span>
          </h3>

          <p className="text-gray-300">{interview.requirement_title || "Role"}</p>

          <div className="mt-3 flex gap-6 text-gray-400 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar size={16} /> {interview.date}
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} /> {interview.time} ({interview.duration || "--"} min)
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 text-gray-400 text-sm">
            <Users size={16} /> {interview.interviewer || "Interviewer TBD"}
          </div>

          <div className="mt-3">
            <span className="text-sm text-gray-400">Stage:</span>
            <span className="text-blue-300 ml-2 font-medium">{interview.stage}</span>

            {editingId === interview.id ? (
              <select
                value={interview.stage}
                onChange={(e) => {
                  updateStage(interview, e.target.value);
                  setEditingId(null);
                }}
                className="border ml-3 px-2 py-1 rounded bg-gray-900 border-purple-500/40 text-white"
                autoFocus
              >
                {(stageTemplates[interview.category] || stageTemplates["Non-IT"]).map(
                  (s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  )
                )}
              </select>
            ) : (
              <button
                onClick={() => setEditingId(interview.id)}
                className="ml-3 text-sm text-purple-300 hover:underline"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <button className="flex items-center gap-2 text-blue-300 hover:text-blue-100">
            <FileText size={16} /> View Details
          </button>

          <button className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded hover:from-blue-600 hover:to-cyan-600">
            <Video size={16} /> Join
          </button>
        </div>
      </div>

      <InterviewTracker category={interview.category} currentStage={interview.stage} />
    </div>
  );
}

/* ============================================================
  Main Interviews component (merged full functionality)
============================================================ */
export default function InterviewsPage() {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [filterCategory, setFilterCategory] = useState("All");
  const [statusTab, setStatusTab] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [interviews, setInterviews] = useState([]);
  const [candidateOptions, setCandidateOptions] = useState([]);
  const [requirementOptions, setRequirementOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchInterviews = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE}/interviews`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load interviews");
      setInterviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load interviews");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCandidates = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/get-candidates?user_role=ADMIN");
      const data = await res.json();
      setCandidateOptions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load candidates:", err);
      setCandidateOptions([]);
    }
  }, []);

  const fetchRequirements = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/get-requirements");
      const data = await res.json();
      setRequirementOptions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load requirements:", err);
      setRequirementOptions([]);
    }
  }, []);

  useEffect(() => {
    fetchInterviews();
    fetchCandidates();
    fetchRequirements();
  }, [fetchInterviews, fetchCandidates, fetchRequirements]);

  const addInterview = async (data) => {
    try {
      await fetch(`${API_BASE}/create-interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: data.candidate_id,
          requirement_id: data.requirement_id,
          category: data.category,
          stage: data.stage,
          date: data.date,
          time: data.time,
          duration: data.duration,
          mode: data.mode,
          location: data.location,
          interviewer: data.interviewer,
          notes: data.notes,
          status: data.status,
        }),
      });
      await fetchInterviews();
    } catch (err) {
      console.error(err);
      alert("Failed to schedule interview. Check backend.");
    }
  };

  const updateStage = async (interview, stage) => {
    try {
      await fetch(`${API_BASE}/update-stage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interview_id: interview.id,
          stage,
          candidate_id: interview.candidate_id,
          requirement_id: interview.requirement_id,
          category: interview.category,
        }),
      });
      await fetchInterviews();
    } catch (err) {
      console.error(err);
      alert("Failed to update stage.");
    }
  };

  const total = interviews.length;
  const upcoming = interviews.filter((i) => (i.status || "").toLowerCase() === "scheduled").length;
  const inProgress = interviews.filter((i) => (i.status || "").toLowerCase() === "in progress").length;
  const completed = interviews.filter((i) => (i.status || "").toLowerCase() === "completed").length;

  const filtered = useMemo(() => {
    return interviews
      .filter((item) =>
        filterCategory === "All" ? true : item.category === filterCategory
      )
      .filter((item) =>
        statusTab === "All"
          ? true
          : (item.status || "Scheduled").toLowerCase() === statusTab.toLowerCase()
      )
      .filter((i) =>
        `${i.candidate_name} ${i.requirement_title} ${i.stage}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
  }, [interviews, filterCategory, statusTab, search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Interview Management</h1>
            <p className="text-gray-400 text-sm">Track and manage every stage with live data</p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white px-5 py-2 rounded-xl hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/40"
          >
            + Schedule Interview
          </button>
        </div>

        {showForm && (
          <ScheduleInterviewForm
            onClose={() => setShowForm(false)}
            onSubmit={addInterview}
            candidateOptions={candidateOptions}
            requirementOptions={requirementOptions}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Calendar size={22} />} label="Total Interviews" value={total} />
          <StatCard icon={<Clock size={22} />} label="Upcoming" value={upcoming} />
          <StatCard icon={<Users size={22} />} label="In Progress" value={inProgress} />
          <StatCard icon={<CheckCircle size={22} />} label="Completed" value={completed} />
        </div>

        <div className="flex gap-4 items-center flex-wrap">
          <input
            type="text"
            placeholder="Search candidate, role or stage..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-gray-800 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[220px]"
          />

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-gray-800 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="All">All Requirement Types</option>
            <option value="IT">IT</option>
            <option value="Non-IT">Non-IT</option>
          </select>
        </div>

        <div className="flex gap-3 border-b border-purple-500/20 pb-2 mt-3 flex-wrap">
          {["All", "Scheduled", "In Progress", "Completed"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm ${
                statusTab === tab
                  ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-300 py-16 animate-pulse">
            Loading interviews...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-400 py-10 text-center">No interviews found</div>
        ) : (
          filtered.map((interview) => (
            <InterviewCard
              key={interview.id}
              interview={interview}
              editingId={editingId}
              setEditingId={setEditingId}
              updateStage={updateStage}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* Small stat card component */
function StatCard({ icon, label, value }) {
  return (
    <div className="bg-gray-800/40 border border-purple-500/30 p-4 rounded-xl shadow flex items-center gap-4">
      <div className="text-cyan-300">{icon}</div>
      <div>
        <p className="text-2xl font-semibold text-white">{value}</p>
        <p className="text-gray-400 text-sm">{label}</p>
      </div>
    </div>
  );
}