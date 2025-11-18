import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [profile, setProfile] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [orgStats, setOrgStats] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return navigate("/");
    const role = (user.role || "").toLowerCase();
    if (role !== "recruiter") navigate("/");
  }, [user, navigate]);

  const loadSelfData = useCallback(async () => {
    if (!user?.id) return;

    setIsRefreshing(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:5000/users/${user.id}/details?role=${user.role || ""}`
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || "Failed to load dashboard data");
      }

      setProfile(payload.profile || null);
      setAssignments(Array.isArray(payload.assignments) ? payload.assignments : []);
      setCandidates(Array.isArray(payload.candidates) ? payload.candidates : []);
      setOrgStats(payload.org_stats || null);
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError(err.message || "Unable to load dashboard data");
      setProfile(null);
      setAssignments([]);
      setCandidates([]);
      setOrgStats(null);
    } finally {
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadSelfData();
  }, [loadSelfData]);

  const handleCreateCandidate = () => {
    const searchParams = new URLSearchParams({ recruiterId: user?.id || "" });
    navigate(`/candidates?${searchParams.toString()}`, {
      state: { from: "/recruiter-dashboard" },
    });
  };

  const refreshAllData = useCallback(() => {
    loadSelfData();
  }, [loadSelfData]);

  const stats = useMemo(
    () => [
      { label: "Assigned Requirements", value: assignments.length, icon: "📋", gradient: "from-blue-500 to-cyan-500" },
      { label: "Candidates Added", value: candidates.length, icon: "🎯", gradient: "from-purple-500 to-pink-500" },
      { label: "Open Requirements", value: orgStats?.open_requirements ?? "—", icon: "📊", gradient: "from-emerald-500 to-teal-500" },
      { label: "Active Clients", value: orgStats?.active_clients ?? "—", icon: "🏢", gradient: "from-amber-500 to-orange-500" },
    ],
    [assignments.length, candidates.length, orgStats]
  );

  const formatDate = (value) =>
    value ? new Date(value).toLocaleString() : "--";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Recruiter Dashboard
            </h2>
            <p className="text-gray-400 text-sm">Manage your assignments and candidates</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={refreshAllData}
              disabled={isRefreshing}
              className="px-6 py-3 bg-gray-700/50 border border-purple-500/30 text-gray-300 rounded-xl hover:bg-gray-700/70 transform hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50"
            >
              {isRefreshing ? "⏳ Refreshing..." : "🔄 Refresh"}
            </button>
            <button
              onClick={handleCreateCandidate}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white rounded-xl hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-lg shadow-purple-500/50 font-semibold"
            >
              ➕ Create Candidate
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl backdrop-blur-sm">
            {error}
          </div>
        )}

        {profile && <ProfileCard profile={profile} />}

        {/* STATS SECTION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} gradient={stat.gradient} />
          ))}
        </div>

        {/* ASSIGNED REQUIREMENTS TABLE */}
        <div className="bg-gray-800/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-300 flex items-center gap-2">
            <span>📋</span>
            <span>Assigned Requirements</span>
          </h3>

          {isRefreshing && assignments.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Loading assignments...</p>
          ) : assignments.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No requirements assigned yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="p-3 text-left text-gray-300 font-semibold">Title</th>
                    <th className="p-3 text-left text-gray-300 font-semibold">Client</th>
                    <th className="p-3 text-left text-gray-300 font-semibold">Experience</th>
                    <th className="p-3 text-left text-gray-300 font-semibold">Skills</th>
                    <th className="p-3 text-left text-gray-300 font-semibold">Assigned Date</th>
                    <th className="p-3 text-left text-gray-300 font-semibold">Assigned By</th>
                    <th className="p-3 text-left text-gray-300 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((req) => (
                    <tr key={req.allocation_id} className="border-t border-purple-500/20 hover:bg-gray-700/30 transition-colors">
                      <td className="p-3 text-gray-300">{req.title}</td>
                      <td className="p-3 text-gray-300">{req.client_name || "--"}</td>
                      <td className="p-3 text-gray-300">
                        {req.experience_required ? `${req.experience_required} yrs` : "--"}
                      </td>
                      <td className="p-3 text-gray-300">{req.skills_required || "--"}</td>
                      <td className="p-3 text-gray-400 text-xs">{formatDate(req.assigned_date)}</td>
                      <td className="p-3 text-gray-300">{req.assigned_by || "--"}</td>
                      <td className="p-3">
                        <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg text-xs font-semibold">
                          {req.status || req.requirement_status || "ASSIGNED"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CANDIDATES TABLE */}
        <div className="bg-gray-800/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold mb-4 text-gray-300 flex items-center gap-2">
            <span>🎯</span>
            <span>Your Candidates</span>
          </h3>

          {isRefreshing && candidates.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Loading candidates...</p>
          ) : candidates.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No candidates added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="p-3 text-left text-gray-300 font-semibold">Candidate</th>
                    <th className="p-3 text-left text-gray-300 font-semibold">Email</th>
                    <th className="p-3 text-left text-gray-300 font-semibold">Phone</th>
                    <th className="p-3 text-left text-gray-300 font-semibold">Skills</th>
                    <th className="p-3 text-left text-gray-300 font-semibold">Experience</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => (
                    <tr key={c.id} className="border-t border-purple-500/20 hover:bg-gray-700/30 transition-colors">
                      <td className="p-3 text-gray-300 font-medium">{c.name}</td>
                      <td className="p-3 text-gray-300">{c.email}</td>
                      <td className="p-3 text-gray-300">{c.phone || "--"}</td>
                      <td className="p-3 text-gray-300">{c.skills || "--"}</td>
                      <td className="p-3 text-gray-300">{c.experience || "--"} yrs</td>
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

function StatCard({ label, value, icon, gradient }) {
  return (
    <div className="group relative bg-gray-800/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 transform hover:scale-105 transition-all duration-300 overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 from-${gradient.split(' ')[1]} to-${gradient.split(' ')[3]}`}></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="text-3xl">{icon}</div>
          <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {value}
          </div>
        </div>
        <div className="text-sm font-semibold text-gray-300">{label}</div>
      </div>
    </div>
  );
}

function ProfileCard({ profile }) {
  const badgeClass =
    profile.status === "ACTIVE"
      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
      : "bg-gradient-to-r from-yellow-500 to-orange-500 text-white";

  return (
    <div className="bg-gray-800/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-xl p-6 mb-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-gray-400 mb-2">My Profile</p>
          <h3 className="text-2xl font-semibold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
            {profile.name}
          </h3>
          <p className="text-sm text-gray-400">{profile.role_label || profile.role}</p>
        </div>
        <span className={`px-4 py-2 rounded-full text-xs font-semibold ${badgeClass}`}>
          {profile.status}
        </span>
      </div>

      <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        <div className="p-3 bg-gray-700/30 rounded-xl">
          <dt className="text-gray-400 mb-1">Email</dt>
          <dd className="text-gray-200 font-medium">{profile.email}</dd>
        </div>
        <div className="p-3 bg-gray-700/30 rounded-xl">
          <dt className="text-gray-400 mb-1">Phone</dt>
          <dd className="text-gray-200 font-medium">{profile.phone || "--"}</dd>
        </div>
        <div className="p-3 bg-gray-700/30 rounded-xl">
          <dt className="text-gray-400 mb-1">Joined</dt>
          <dd className="text-gray-200 font-medium">
            {profile.joined_at ? new Date(profile.joined_at).toLocaleDateString() : "--"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
