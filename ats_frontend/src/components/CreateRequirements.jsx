import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createRequirement, fetchClients } from "../auth/authSlice";

export default function CreateRequirements() {
  const dispatch = useDispatch();
  const [jdText, setJdText] = useState("");
  const [autoData, setAutoData] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const { user, clients } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    client_id: "",
    title: "",
    description: "",
    location: "",
    skills_required: "",
    experience_required: "",
    ctc_range: "",
    ectc_range: "",
  });

  async function handleAutoFill() {
    if (!jdText.trim()) {
      alert("Please enter a job description first");
      return;
    }

    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/ai/jd-to-requirement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd_text: jdText })
      });
      
      const data = await res.json();
      
      if (data.error) {
        setAiError(data.error);
        alert(`AI Error: ${data.error}`);
        return;
      }

      if (data.suggested_requirement) {
        setAutoData(data.suggested_requirement);
        setForm(prev => ({
          ...prev,
          title: data.suggested_requirement.title || prev.title,
          location: data.suggested_requirement.location || prev.location,
          skills_required: data.suggested_requirement.skills_required || prev.skills_required,
          experience_required: data.suggested_requirement.experience_required || prev.experience_required,
          ctc_range: data.suggested_requirement.ctc_range || prev.ctc_range,
          ectc_range: data.suggested_requirement.ectc_range || data.suggested_requirement.expected_ctc_range || prev.ectc_range,
          description: data.suggested_requirement.description || prev.description,
        }));
        alert("✅ Form auto-filled from job description!");
      }
    } catch (error) {
      setAiError(error.message);
      alert(`Error: ${error.message}`);
    } finally {
      setAiLoading(false);
    }
  }

  const canCreate = ["ADMIN", "DELIVERY_MANAGER"].includes(user?.role);

  useEffect(() => {
    dispatch(fetchClients());
  }, [dispatch]);

  if (!canCreate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-red-400 font-semibold text-xl">
          ❌ You are not allowed to create requirements
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, created_by: user?.role || "" };
    dispatch(createRequirement(payload))
      .unwrap()
      .then(() => {
        alert("✅ Requirement Created Successfully!");
        setForm({
          client_id: "",
          title: "",
          description: "",
          location: "",
          skills_required: "",
          experience_required: "",
          ctc_range: "",
          ectc_range: "",
        });
        setJdText("");
      })
      .catch(() => alert("❌ Error creating requirement"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Create New Requirement
          </h2>

          {/* AI JD Parser Section */}
          <div className="mb-6 p-6 bg-gray-700/30 border border-purple-500/30 rounded-xl">
            <label className="block text-sm font-medium mb-3 text-gray-300">
              📝 Paste Job Description (AI will auto-fill form)
            </label>
            <div className="flex gap-3">
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the complete job description here..."
                className="flex-1 bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none h-32"
              />
              <button
                type="button"
                onClick={handleAutoFill}
                disabled={aiLoading || !jdText.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-lg shadow-purple-500/50 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {aiLoading ? "⏳ Processing..." : "✨ AI Fill"}
              </button>
            </div>
            {aiError && (
              <p className="text-red-400 text-sm mt-3">⚠️ {aiError}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
            {/* Client Dropdown */}
            <select
              name="client_id"
              value={form.client_id}
              onChange={handleChange}
              className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all col-span-2"
              required
            >
              <option value="" className="bg-gray-800">Select Client</option>
              {clients?.length > 0 &&
                clients.map((c) => (
                  <option key={c.id} value={c.id} className="bg-gray-800">
                    {c.name}
                  </option>
                ))}
            </select>

            <input
              name="title"
              placeholder="Job Title"
              value={form.title}
              onChange={handleChange}
              className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              required
            />
            <input
              name="location"
              placeholder="Location"
              value={form.location}
              onChange={handleChange}
              className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              required
            />

            <input
              name="experience_required"
              placeholder="Experience (years)"
              value={form.experience_required}
              onChange={handleChange}
              className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
            <input
              name="skills_required"
              placeholder="Skills (comma separated)"
              value={form.skills_required}
              onChange={handleChange}
              className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />

            <input
              name="ctc_range"
              placeholder="CTC Range"
              value={form.ctc_range}
              onChange={handleChange}
              className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
            <input
              name="ectc_range"
              placeholder="Expected CTC"
              value={form.ectc_range}
              onChange={handleChange}
              className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />

            <textarea
              name="description"
              placeholder="Job Description"
              value={form.description}
              onChange={handleChange}
              className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none col-span-2 h-32"
              required
            />
            
            <button
              type="submit"
              className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white py-3 rounded-xl hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-lg shadow-purple-500/50 font-semibold col-span-2"
            >
              Create Requirement
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
