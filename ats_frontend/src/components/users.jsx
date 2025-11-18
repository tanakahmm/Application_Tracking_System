import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  clearMessages,
} from "../auth/authSlice";

export default function Users() {
  const dispatch = useDispatch();
  const { usersList = [], loading, successMessage, error } = useSelector(
    (state) => state.auth
  );

  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    password: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => dispatch(clearMessages()), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error, dispatch]);

  const safeUsers = Array.isArray(usersList) ? usersList : [];
  const filtered = safeUsers.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      dispatch(updateUser({ id: editingUser.id, ...form })).then((res) => {
        if (res.meta.requestStatus === "fulfilled") {
          setEditingUser(null);
          setForm({ name: "", email: "", phone: "", role: "", password: "", status: "ACTIVE" });
          dispatch(fetchUsers());
        }
      });
    } else {
      dispatch(createUser(form)).then((res) => {
        if (res.meta.requestStatus === "fulfilled") {
          setForm({ name: "", email: "", phone: "", role: "", password: "", status: "ACTIVE" });
          dispatch(fetchUsers());
        }
      });
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      password: "",
      status: user.status || "ACTIVE",
    });
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      dispatch(deleteUser(id)).then(() => dispatch(fetchUsers()));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          User Management
        </h2>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-xl backdrop-blur-sm">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-500/20 border border-green-500/50 text-green-300 px-4 py-3 rounded-xl backdrop-blur-sm">
            {successMessage}
          </div>
        )}

        {/* Add/Edit Form */}
        <div className="bg-gray-800/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">
            {editingUser ? "Edit User" : "Add New User"}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name *"
              className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Email *"
              className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Phone Number *"
              className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
            <select
              className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="" className="bg-gray-800">Select Role</option>
              <option value="ADMIN" className="bg-gray-800">Admin</option>
              <option value="DELIVERY_MANAGER" className="bg-gray-800">Delivery Manager</option>
              <option value="TEAM_LEAD" className="bg-gray-800">Team Lead</option>
              <option value="RECRUITER" className="bg-gray-800">Recruiter</option>
              <option value="CLIENT" className="bg-gray-800">Client</option>
            </select>
            <input
              type="password"
              placeholder={editingUser ? "New Password (optional)" : "Password *"}
              className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!editingUser}
            />
            <div className="flex gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white py-3 rounded-xl hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-lg shadow-purple-500/50 font-semibold disabled:opacity-50"
              >
                {loading ? "Saving..." : editingUser ? "Update User" : "Add User"}
              </button>
              {editingUser && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    setForm({ name: "", email: "", phone: "", role: "", password: "", status: "ACTIVE" });
                  }}
                  className="px-6 py-3 bg-gray-700/50 border border-purple-500/30 text-gray-300 rounded-xl hover:bg-gray-700/70 transition-all font-semibold"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Search Bar */}
        <div className="bg-gray-800/40 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-xl p-4">
          <input
            type="text"
            placeholder="🔍 Search Users by Name / Email / Role / Phone"
            className="w-full bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Users Table */}
        <div className="bg-gray-800/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-xl p-6">
          <h3 className="font-semibold text-lg mb-4 text-gray-300">Users List</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="p-3 text-left text-gray-300 font-semibold border-b border-purple-500/20">Name</th>
                  <th className="p-3 text-left text-gray-300 font-semibold border-b border-purple-500/20">Email</th>
                  <th className="p-3 text-left text-gray-300 font-semibold border-b border-purple-500/20">Phone</th>
                  <th className="p-3 text-left text-gray-300 font-semibold border-b border-purple-500/20">Role</th>
                  <th className="p-3 text-center text-gray-300 font-semibold border-b border-purple-500/20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t border-purple-500/20 hover:bg-gray-700/30 transition-colors">
                    <td className="p-3 text-gray-300">{u.name}</td>
                    <td className="p-3 text-gray-300">{u.email}</td>
                    <td className="p-3 text-gray-300">{u.phone || "-"}</td>
                    <td className="p-3 text-gray-300">{u.role || "-"}</td>
                    <td className="p-3 text-center flex gap-2 justify-center">
                      <button
                        onClick={() => handleEdit(u)}
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-cyan-600 transform hover:scale-105 transition-all text-xs font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all text-xs font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-gray-400">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
