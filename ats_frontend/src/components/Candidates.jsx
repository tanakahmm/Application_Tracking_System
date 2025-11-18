import React, { useState, useEffect } from "react";
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
