import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getUsers, createUser, clearMessages } from "../auth/authSlice";

function StatCard({ title, value, subtitle, gradient, icon }) {
  return (
    <div className="group relative bg-gray-800/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 transform hover:scale-105 transition-all duration-300 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: gradient }}></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="text-3xl">{icon}</div>
          <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {value}
          </div>
        </div>
        <div className="text-sm font-semibold text-gray-300 mb-1">{title}</div>
        {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
      </div>
    </div>
  );
}

function QuickAction({ label, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white rounded-xl hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-lg shadow-purple-500/50 font-semibold"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function RolePill({ role }) {
  const map = {
    ADMIN: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
    DELIVERY_MANAGER: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
    TEAM_LEAD: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white",
    RECRUITER: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
    CLIENT: "bg-gradient-to-r from-gray-500 to-gray-600 text-white",
  };
  return (
    <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${map[role] || "bg-gray-600 text-white"}`}>
      {role}
    </span>
  );
}

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { usersList, loading, error, successMessage, user: currentUser } = useSelector((s) => s.auth);

  const [openCreate, setOpenCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "RECRUITER",
    password: "",
  });

  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  useEffect(() => {
    if (error || successMessage) {
      const t = setTimeout(() => dispatch(clearMessages()), 2500);
      return () => clearTimeout(t);
    }
  }, [error, successMessage, dispatch]);

  const stats = useMemo(() => {
    const total = usersList?.length || 0;
    const active = usersList?.filter(u => u.status === "ACTIVE").length || 0;
    const byRole = (role) => usersList?.filter(u => u.role === role).length || 0;
    return { total, active, admins: byRole("ADMIN"), recruiters: byRole("RECRUITER") };
  }, [usersList]);

  const filteredUsers = useMemo(() => {
    let filtered = usersList || [];
    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterRole !== "ALL") {
      filtered = filtered.filter(u => u.role === filterRole);
    }
    return filtered;
  }, [usersList, searchTerm, filterRole]);

  const top5 = useMemo(() => filteredUsers.slice(0, 5), [filteredUsers]);

  const handleCreate = (e) => {
    e.preventDefault();
    dispatch(createUser(form)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        setForm({ name: "", email: "", phone: "", role: "RECRUITER", password: "" });
        setOpenCreate(false);
        dispatch(getUsers());
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/40 backdrop-blur-xl border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
              Admin Dashboard
            </h1>
            <p className="text-gray-400 text-sm">Manage your recruitment ecosystem</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <QuickAction label="Create User" onClick={() => setOpenCreate(true)} icon="➕" />
            <button className="flex items-center gap-2 px-6 py-3 bg-gray-700/50 border border-purple-500/30 text-gray-300 rounded-xl hover:bg-gray-700/70 transform hover:scale-105 transition-all duration-300 font-semibold">
              <span>📊</span>
              <span>Reports</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Toasts */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl backdrop-blur-sm animate-pulse">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 px-4 py-3 rounded-xl backdrop-blur-sm">
            {successMessage}
          </div>
        )}

        {/* KPI cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Users" 
            value={stats.total} 
            subtitle="All users created by Admin"
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            icon="👥"
          />
          <StatCard 
            title="Active Users" 
            value={stats.active} 
            subtitle="Status: ACTIVE"
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            icon="✅"
          />
          <StatCard 
            title="Admins" 
            value={stats.admins} 
            subtitle="Role count"
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            icon="👑"
          />
          <StatCard 
            title="Recruiters" 
            value={stats.recruiters} 
            subtitle="Role count"
            gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
            icon="🎯"
          />
        </section>

        {/* Search and Filter */}
        <section className="bg-gray-800/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-xl p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="DELIVERY_MANAGER">Delivery Manager</option>
              <option value="TEAM_LEAD">Team Lead</option>
              <option value="RECRUITER">Recruiter</option>
              <option value="CLIENT">Client</option>
            </select>
          </div>
        </section>

        {/* Role distribution bar */}
        <section className="bg-gray-800/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-300">Role Distribution</h2>
          <div className="w-full h-4 bg-gray-700/50 rounded-xl overflow-hidden shadow-inner">
            {(() => {
              const total = stats.total || 1;
              const counts = ["ADMIN","DELIVERY_MANAGER","TEAM_LEAD","RECRUITER","CLIENT"].map(
                r => (usersList?.filter(u => u.role === r).length || 0)
              );
              const colors = [
                "bg-gradient-to-r from-purple-500 to-pink-500",
                "bg-gradient-to-r from-amber-500 to-orange-500",
                "bg-gradient-to-r from-blue-500 to-cyan-500",
                "bg-gradient-to-r from-emerald-500 to-teal-500",
                "bg-gradient-to-r from-gray-500 to-gray-600"
              ];
              return counts.map((c, i) => (
                <div
                  key={i}
                  className={`${colors[i]} h-4 transition-all duration-500`}
                  style={{ width: `${(c / total) * 100}%` }}
                  title={`${c}`}
                />
              ));
            })()}
          </div>
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-400">
            <span><span className="inline-block w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 mr-2 rounded-sm" /> Admin</span>
            <span><span className="inline-block w-3 h-3 bg-gradient-to-r from-amber-500 to-orange-500 mr-2 rounded-sm" /> Delivery Manager</span>
            <span><span className="inline-block w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 mr-2 rounded-sm" /> Team Lead</span>
            <span><span className="inline-block w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-500 mr-2 rounded-sm" /> Recruiter</span>
            <span><span className="inline-block w-3 h-3 bg-gradient-to-r from-gray-500 to-gray-600 mr-2 rounded-sm" /> Client</span>
          </div>
        </section>

        {/* Users preview table */}
        <section className="bg-gray-800/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-300">Recent Users</h2>
            <a href="/users" className="text-purple-400 text-sm hover:text-purple-300 font-semibold hover:underline transition-colors">
              View all →
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-purple-500/30 rounded-xl overflow-hidden">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Phone</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Created</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="px-4 py-5 text-sm text-gray-400 text-center" colSpan={6}>Loading…</td></tr>
                ) : top5.length ? (
                  top5.map((u) => (
                    <tr key={u.id} className="border-t border-purple-500/20 hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-300">{u.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{u.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{u.phone || "-"}</td>
                      <td className="px-4 py-3 text-sm"><RolePill role={u.role} /></td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          u.status === "ACTIVE" 
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white" 
                            : "bg-gradient-to-r from-red-500 to-pink-500 text-white"
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td className="px-4 py-5 text-sm text-gray-400 text-center" colSpan={6}>No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Create User Modal */}
      {openCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-purple-500/30 w-full max-w-lg rounded-2xl shadow-2xl p-6 transform scale-100 animate-modal">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Create User</h3>
              <button 
                className="text-gray-400 hover:text-white transition-colors text-2xl" 
                onClick={() => setOpenCreate(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
              <input
                type="text"
                name="phone"
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
              <select
                name="role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              >
                <option value="ADMIN">Admin</option>
                <option value="DELIVERY_MANAGER">Delivery Manager</option>
                <option value="TEAM_LEAD">Team Lead</option>
                <option value="RECRUITER">Recruiter</option>
                <option value="CLIENT">Client</option>
              </select>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all sm:col-span-2"
              />
              <div className="flex gap-3 sm:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white px-4 py-3 rounded-xl hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-lg shadow-purple-500/50 font-semibold disabled:opacity-50"
                >
                  {loading ? "Creating…" : "Create User"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpenCreate(false)}
                  className="px-6 py-3 bg-gray-700/50 border border-purple-500/30 text-gray-300 rounded-xl hover:bg-gray-700/70 transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modal {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-modal {
          animation: modal 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
