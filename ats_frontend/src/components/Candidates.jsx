import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function CandidateApplicationUI() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    skills: "",
    education: "",
    experience: "",
  });
  const [resume, setResume] = useState(null);
  const [message, setMessage] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [editCandidateId, setEditCandidateId] = useState(null);
  const [requirementsOptions, setRequirementsOptions] = useState([]);
  const [requirementsLoading, setRequirementsLoading] = useState(false);

  const recruiterIdFromQuery = searchParams.get("recruiterId");
  const createdByUserId = recruiterIdFromQuery ? parseInt(recruiterIdFromQuery) : (user?.id || null);

  const fetchCandidates = async () => {
    try {
      const params = new URLSearchParams();
      if (user?.id) {
        params.append("user_id", user.id);
        params.append("user_role", user.role || "");
      }
      const response = await fetch(`http://localhost:5000/get-candidates?${params.toString()}`);
      const data = await response.json();
      setCandidates(data);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [user]);

  useEffect(() => {
    const fetchRequirementsOptions = async () => {
      try {
        setRequirementsLoading(true);
        const res = await fetch("http://localhost:5000/get-requirements");
        const data = await res.json();
        if (Array.isArray(data)) {
          setRequirementsOptions(data);
        } else {
          setRequirementsOptions([]);
        }
      } catch (err) {
        console.error("Error loading requirements:", err);
        setRequirementsOptions([]);
      } finally {
        setRequirementsLoading(false);
      }
    };

    fetchRequirementsOptions();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setResume(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    if (resume) data.append("resume_file", resume);
    
    if (!editCandidateId && createdByUserId) {
      data.append("created_by", createdByUserId);
    }

    try {
      let url = "http://localhost:5000/submit-candidate";
      let method = "POST";

      if (editCandidateId) {
        url = `http://localhost:5000/update-candidate/${editCandidateId}`;
        method = "PUT";
      }

      const response = await fetch(url, { method, body: data });
      const result = await response.json();

      if (response.ok) {
        setMessage(`✅ ${result.message}`);
        fetchCandidates();
        setFormData({
          name: "",
          email: "",
          phone: "",
          skills: "",
          education: "",
          experience: "",
        });
        setResume(null);
        setEditCandidateId(null);
        
        const fromState = window.history.state?.usr?.from;
        if (fromState === "/recruiter-dashboard") {
          setTimeout(() => navigate("/recruiter-dashboard"), 1500);
        }
      } else {
        setMessage(`❌ ${result.message || "Failed to submit"}`);
      }
    } catch (error) {
      console.error(error);
      setMessage("❌ Server not reachable. Check backend.");
    }
  };

  const handleEdit = (candidate) => {
    setEditCandidateId(candidate.id);
    setFormData({
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      skills: candidate.skills,
      education: candidate.education,
      experience: candidate.experience,
    });
    setMessage("✏ Editing candidate...");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this candidate?")) return;
    try {
      const response = await fetch(`http://localhost:5000/delete-candidate/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (response.ok) {
        setMessage(`🗑 ${result.message}`);
        fetchCandidates();
      } else {
        setMessage(`❌ ${result.message || "Failed to delete"}`);
      }
    } catch (error) {
      console.error(error);
      setMessage("❌ Server not reachable. Check backend.");
    }
  };

  const [screeningResult, setScreeningResult] = useState(null);
  const [screenLoading, setScreenLoading] = useState(false);
  const [screenError, setScreenError] = useState("");
  const [screenCandidate, setScreenCandidate] = useState(null);
  const [showScreenModal, setShowScreenModal] = useState(false);
  const [selectedRequirementId, setSelectedRequirementId] = useState("");
  const [requirementSearch, setRequirementSearch] = useState("");

  const filteredRequirements = useMemo(() => {
    if (!requirementSearch) return requirementsOptions;
    return requirementsOptions.filter((req) => {
      const haystack = `${req.title} ${req.location} ${req.client_id || ""}`.toLowerCase();
      return haystack.includes(requirementSearch.toLowerCase());
    });
  }, [requirementsOptions, requirementSearch]);

  const openScreenModal = (candidate) => {
    setScreenCandidate(candidate);
    setSelectedRequirementId("");
    setRequirementSearch("");
    setScreenError("");
    setShowScreenModal(true);
  };

  const handleScreenCandidate = async () => {
    if (!screenCandidate || !selectedRequirementId) {
      setScreenError("Please select a requirement to compare against.");
      return;
    }

    setScreenLoading(true);
    setScreenError("");

    try {
      const response = await fetch("http://localhost:5000/api/screen-candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: screenCandidate.id,
          requirement_id: selectedRequirementId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setScreenError(data.error || "AI screening failed");
      } else {
        setScreeningResult(data.result);
        setShowScreenModal(false);
      }
    } catch (err) {
      console.error(err);
      setScreenError("Server error. Check backend.");
    }

    setScreenLoading(false);
  };
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Form Section */}
        <div className="bg-gray-800/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {editCandidateId ? "✏ Edit Candidate" : "🧾 Candidate Application"}
          </h2>

          {message && (
            <div className={`mb-6 p-4 rounded-xl backdrop-blur-sm ${
              message.includes("✅") 
                ? "bg-green-500/20 border border-green-500/50 text-green-300" 
                : "bg-red-500/20 border border-red-500/50 text-red-300"
            }`}>
              <p className="text-center font-medium">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Full Name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  type="text"
                  placeholder="Enter full name"
                  className="w-full bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Email</label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email"
                  placeholder="you@example.com"
                  className="w-full bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Phone</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="w-full bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Skills</label>
                <input
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  type="text"
                  placeholder="React, Node.js, SQL..."
                  className="w-full bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Education Summary</label>
              <textarea
                name="education"
                value={formData.education}
                onChange={handleChange}
                placeholder="E.g., B.Tech in Computer Science from XYZ University"
                className="w-full bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Experience Summary</label>
              <textarea
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                placeholder="E.g., 3 years as Frontend Developer at ABC Corp"
                className="w-full bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                rows="4"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Upload Resume (PDF/DOCX)</label>
              <div className="border-dashed border-2 border-purple-500/30 rounded-xl p-6 text-center hover:border-purple-500/60 transition bg-gray-700/20">
                <input
                  type="file"
                  id="resume"
                  className="hidden"
                  accept=".pdf,.docx,.doc"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="resume"
                  className="cursor-pointer text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                >
                  {editCandidateId ? "Click to upload new resume (optional)" : "Click to upload resume"}
                </label>
                {resume && <p className="text-sm text-gray-300 mt-2">{resume.name}</p>}
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                type="submit"
                className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white px-8 py-3 rounded-xl hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-lg shadow-purple-500/50 font-semibold"
              >
                {editCandidateId ? "Update Candidate" : "Submit Application"}
              </button>

              <button
                type="button"
                className="bg-gray-700/50 border border-purple-500/30 text-gray-300 px-8 py-3 rounded-xl hover:bg-gray-700/70 transform hover:scale-105 transition-all duration-300 font-semibold"
                onClick={() => {
                  setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    skills: "",
                    education: "",
                    experience: "",
                  });
                  setResume(null);
                  setEditCandidateId(null);
                  setMessage("");
                }}
              >
                Clear
              </button>
            </div>
          </form>
        </div>

        {/* Candidate List Section */}
        <div className="bg-gray-800/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-300 flex items-center gap-2">
            <span>📋</span>
            <span>Candidate List</span>
          </h2>

          {screenLoading && (
            <div className="text-center text-purple-300 py-4 animate-pulse">
              🔍 AI is screening candidate... please wait
            </div>
          )}

          {candidates.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No candidates found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="p-3 text-left text-gray-300 font-semibold border-b border-purple-500/20">Name</th>
                    <th className="p-3 text-left text-gray-300 font-semibold border-b border-purple-500/20">Email</th>
                    <th className="p-3 text-left text-gray-300 font-semibold border-b border-purple-500/20">Phone</th>
                    <th className="p-3 text-left text-gray-300 font-semibold border-b border-purple-500/20">Skills</th>
                    <th className="p-3 text-left text-gray-300 font-semibold border-b border-purple-500/20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate) => (
                    <tr key={candidate.id} className="border-b border-purple-500/20 hover:bg-gray-700/30 transition-colors">
                      <td className="p-3 text-gray-300">{candidate.name}</td>
                      <td className="p-3 text-gray-300">{candidate.email}</td>
                      <td className="p-3 text-gray-300">{candidate.phone}</td>
                      <td className="p-3 text-gray-300">{candidate.skills}</td>
                      <td className="p-3 flex gap-2">
                        <button
                          onClick={() => handleEdit(candidate)}
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-cyan-600 transform hover:scale-105 transition-all text-xs font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(candidate.id)}
                          className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all text-xs font-semibold"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => openScreenModal(candidate)}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all text-xs font-semibold"
                        >
                          Screen Candidate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Requirement Picker Modal */}
      {showScreenModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-gray-800 border border-purple-500/30 rounded-2xl p-6 w-full max-w-xl shadow-2xl relative">
            <button
              onClick={() => {
                setShowScreenModal(false);
                setScreenError("");
              }}
              className="absolute top-4 right-4 text-gray-300 hover:text-white text-xl"
            >
              ✖
            </button>

            <h2 className="text-2xl font-bold mb-2 text-gradient text-center">Select Requirement</h2>
            <p className="text-gray-400 text-sm text-center mb-4">
              Choose which requirement you want to compare <span className="text-gray-200 font-semibold">{screenCandidate?.name}</span> against.
            </p>

            <input
              type="text"
              value={requirementSearch}
              onChange={(e) => setRequirementSearch(e.target.value)}
              placeholder="Search by title, client, or location"
              className="w-full bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all mb-4"
            />

            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {requirementsLoading ? (
                <p className="text-center text-gray-400 py-6">Loading requirements...</p>
              ) : filteredRequirements.length === 0 ? (
                <p className="text-center text-gray-400 py-6">No matching requirements found.</p>
              ) : (
                filteredRequirements.map((req) => (
                  <button
                    key={req.id}
                    type="button"
                    onClick={() => setSelectedRequirementId(req.id)}
                    className={`w-full text-left bg-gray-700/40 border rounded-xl px-4 py-3 transition-all ${
                      selectedRequirementId === req.id
                        ? "border-cyan-400 shadow-lg shadow-cyan-500/20"
                        : "border-purple-500/20 hover:border-purple-400/80"
                    }`}
                  >
                    <div className="flex justify-between text-gray-200 font-semibold">
                      <span>{req.title}</span>
                      <span className="text-xs text-gray-400">{req.location || "--"}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Requirement ID: {req.id} • Skills: {req.skills_required || "--"}
                    </p>
                  </button>
                ))
              )}
            </div>

            {screenError && (
              <p className="text-red-400 text-sm mt-3">{screenError}</p>
            )}

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => {
                  setShowScreenModal(false);
                  setScreenError("");
                }}
                className="px-6 py-2 bg-gray-700/50 border border-purple-500/30 text-gray-300 rounded-xl hover:bg-gray-700/70 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleScreenCandidate}
                disabled={screenLoading || !selectedRequirementId}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-300 shadow-lg shadow-emerald-500/40 font-semibold disabled:opacity-50"
              >
                {screenLoading ? "Screening..." : "Run AI Screening"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Screening Result Modal */}
      {screeningResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-gray-800/80 border border-purple-500/40 rounded-2xl p-6 w-full max-w-lg shadow-xl relative">
            <button
              onClick={() => setScreeningResult(null)}
              className="absolute top-4 right-4 text-gray-300 hover:text-white text-xl"
            >
              ✖
            </button>

            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent text-center mb-4">
              🤖 AI Screening Result
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm">AI Score</p>
                <p className="text-3xl font-bold text-purple-300">{screeningResult.score}/100</p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">Recommendation</p>
                <span
                  className={`px-4 py-1 rounded-xl text-sm font-semibold ${
                    screeningResult.recommend === "SHORTLISTED"
                      ? "bg-green-500/30 text-green-300 border border-green-500/50"
                      : screeningResult.recommend === "REJECTED"
                      ? "bg-red-500/30 text-red-300 border border-red-500/50"
                      : "bg-yellow-500/30 text-yellow-300 border border-yellow-500/50"
                  }`}
                >
                  {screeningResult.recommend}
                </span>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">📌 Rationale</p>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  {screeningResult.rationale.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              {screeningResult.red_flags?.length > 0 && (
                <div>
                  <p className="text-gray-400 text-sm mb-1">⚠ Red Flags</p>
                  <ul className="list-disc list-inside text-red-300 space-y-1">
                    {screeningResult.red_flags.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
