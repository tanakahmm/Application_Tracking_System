import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000";

export default function CandidateList() {
  const [candidates, setCandidates] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [selectedReq, setSelectedReq] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadCandidates();
    loadRequirements();
  }, []);

  const loadCandidates = async () => {
    try {
      const res = await fetch(`${API_BASE}/get-candidates?user_role=ADMIN`);
      const data = await res.json();
      setCandidates(data || []);
    } catch (err) {
      console.error("Error loading candidates:", err);
    }
  };

  const loadRequirements = async () => {
    try {
      const res = await fetch(`${API_BASE}/get-requirements`);
      const data = await res.json();
      setRequirements(data || []);
    } catch (err) {
      console.error("Error loading requirements:", err);
    }
  };

  const navigateToTracking = (candidateId) => {
    if (!selectedReq) {
      alert("Select a requirement first!");
      return;
    }

    navigate(`/candidate-tracking/${candidateId}/${selectedReq}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        <h1 className="text-3xl font-bold text-white mb-4">
          Candidates List
        </h1>

        {/* Requirement Selector (Top Dropdown) */}
        <div className="bg-gray-900/60 border border-purple-500/30 rounded-xl p-4">
          <label className="text-gray-300 text-sm">Select Requirement</label>
          <select
            value={selectedReq}
            onChange={(e) => setSelectedReq(e.target.value)}
            className="w-full mt-2 bg-gray-800 border border-purple-500/30 text-white p-2 rounded-lg"
          >
            <option value="">-- Choose Requirement --</option>
            {requirements.map((req) => (
              <option key={req.id} value={req.id}>
                {req.title} — {req.location}
              </option>
            ))}
          </select>
        </div>

        {/* Candidates Table */}
        <table className="w-full text-left bg-gray-900/70 border border-purple-500/30 rounded-xl">
          <thead>
            <tr className="text-purple-300 border-b border-purple-500/20">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {candidates.map((cand) => (
              <tr key={cand.id} className="border-b border-gray-800">
                <td className="p-3 text-white">{cand.name}</td>
                <td className="p-3 text-gray-300">{cand.email}</td>
                <td className="p-3 text-gray-300">{cand.phone}</td>
                <td className="p-3">
                  <button
                    onClick={() => navigateToTracking(cand.id)}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Track Progress
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
