import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchClients,
  createClient,
  updateClient,
  deleteClient,
  clearMessages,
} from "../auth/authSlice";

export default function Clients() {
  const dispatch = useDispatch();
  const { clients = [], loading, successMessage, error } = useSelector(
    (state) => state.auth
  );

  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    contact_person: "",
    location: "",
    phone: "",
  });

  const [editForm, setEditForm] = useState(null);

  const filtered = clients.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    dispatch(fetchClients());
  }, [dispatch]);

  useEffect(() => {
    if (successMessage || error) {
      setTimeout(() => dispatch(clearMessages()), 3000);
    }
  }, [successMessage, error, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createClient(form)).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        setForm({ name: "", email: "", contact_person: "", location: "", phone: "" });
        dispatch(fetchClients());
      }
    });
  };

  const handleEdit = (client) => {
    setEditForm(client);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    dispatch(updateClient({ id: editForm.id, clientData: editForm })).then((res) => {
      if (res.meta.requestStatus === "fulfilled") {
        setEditForm(null);
        dispatch(fetchClients());
      }
    });
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this client?")) {
      dispatch(deleteClient(id)).then(() => dispatch(fetchClients()));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
          Client Management
        </h2>

        {/* Alerts */}
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

        {/* Add New Client */}
        <div className="bg-gray-800/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">Add New Client</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Client Name *"
              className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Contact Person"
              className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              value={form.contact_person}
              onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <input
              type="text"
              placeholder="Phone"
              className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <input
              type="text"
              placeholder="Location"
              className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white py-3 rounded-xl hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-lg shadow-purple-500/50 font-semibold disabled:opacity-50"
            >
              {loading ? "Saving..." : "Add Client"}
            </button>
          </form>
        </div>

        {/* Search */}
        <div className="bg-gray-800/40 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-xl p-4">
          <input
            type="text"
            placeholder="🔍 Search Clients by Name/Email"
            className="w-full bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Clients List */}
        <div className="bg-gray-800/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-xl p-6">
          <h3 className="font-semibold text-lg mb-4 text-gray-300">Clients List</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="p-3 text-left text-gray-300 font-semibold border-b border-purple-500/20">Client</th>
                  <th className="p-3 text-left text-gray-300 font-semibold border-b border-purple-500/20">Contact Person</th>
                  <th className="p-3 text-left text-gray-300 font-semibold border-b border-purple-500/20">Email</th>
                  <th className="p-3 text-left text-gray-300 font-semibold border-b border-purple-500/20">Phone</th>
                  <th className="p-3 text-left text-gray-300 font-semibold border-b border-purple-500/20">Location</th>
                  <th className="p-3 text-left text-gray-300 font-semibold border-b border-purple-500/20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-t border-purple-500/20 hover:bg-gray-700/30 transition-colors">
                    <td className="p-3 text-gray-300">{c.name}</td>
                    <td className="p-3 text-gray-300">{c.contact_person || "-"}</td>
                    <td className="p-3 text-gray-300">{c.email || "-"}</td>
                    <td className="p-3 text-gray-300">{c.phone || "-"}</td>
                    <td className="p-3 text-gray-300">{c.address || "-"}</td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(c)}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-lg hover:from-yellow-600 hover:to-orange-600 transform hover:scale-105 transition-all text-xs font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
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
        </div>

        {/* Edit Modal */}
        {editForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 border border-purple-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-semibold mb-4 text-gray-300">Edit Client</h3>
              <form onSubmit={handleUpdate} className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  placeholder="Client Name *"
                  className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
                <input
                  type="text"
                  placeholder="Contact Person"
                  className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  value={editForm.contact_person}
                  onChange={(e) => setEditForm({ ...editForm, contact_person: e.target.value })}
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Phone"
                  className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Location"
                  className="bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />
                <div className="flex justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setEditForm(null)}
                    className="px-6 py-2 bg-gray-700/50 border border-purple-500/30 text-gray-300 rounded-xl hover:bg-gray-700/70 transition-all font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white rounded-xl hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-lg shadow-purple-500/50 font-semibold"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
