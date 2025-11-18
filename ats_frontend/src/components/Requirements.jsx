import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchRequirements, fetchClients } from "../auth/authSlice";
import { useNavigate } from "react-router-dom";

export default function Requirements() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, requirements, clients, loading } = useSelector(
    (state) => state.auth
  );

  const [selectedClient, setSelectedClient] = useState("");
  const [selectedReq, setSelectedReq] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const [recruiters, setRecruiters] = useState([]);
  const [selectedRecruiter, setSelectedRecruiter] = useState("");

  const [assignedList, setAssignedList] = useState([]);

  useEffect(() => {
    dispatch(fetchRequirements());
    dispatch(fetchClients());
    loadRecruiters();
  }, [dispatch]);

  useEffect(() => {
    if (requirements.length > 0) fetchAssignedRecruiters(requirements);
    else setAssignedList([]);
  }, [requirements]);

  const loadRecruiters = async () => {
    try {
      const res = await fetch("http://localhost:5000/get-recruiters");
      const data = await res.json();
      setRecruiters(data);
    } catch (err) {
      console.error("Recruiter load error:", err);
    }
  };

  const fetchAssignedRecruiters = async (reqList) => {
    try {
      const all = await Promise.all(
        reqList.map(async (req) => {
          const res = await fetch(`http://localhost:5000/requirements/${req.id}/allocations`);

          if (!res.ok) return [];

          const data = await res.json();
          return data.map((item) => ({
            id: item.id,
            requirementId: req.id,
            requirementTitle: req.title,
            recruiter: item.recruiter_name,
            assignedDate: item.created_at
              ? new Date(item.created_at).toLocaleString()
              : "-",
            status: item.status || "Assigned",
          }));
        })
      );

      setAssignedList(all.flat());
    } catch (error) {
      console.error("Assigned recruiters error:", error);
    }
  };

  const canCreate = ["ADMIN", "DELIVERY_MANAGER"].includes(user?.role);
  const canAssign = ["ADMIN", "DELIVERY_MANAGER"].includes(user?.role);

  const handleAssignConfirm = async () => {
    if (!selectedReq || !selectedRecruiter) return;

    try {
      const res = await fetch("http://localhost:5000/assign-requirement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirement_id: selectedReq.id,
          recruiter_id: parseInt(selectedRecruiter),
          assigned_by: user.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to assign recruiter");
        return;
      }

      const recruiterName =
        recruiters.find((r) => r.id === parseInt(selectedRecruiter))?.name ||
        "Unknown";

      setAssignedList((prev) => [
        ...prev,
        {
          id: data.allocation_id,
          requirementId: selectedReq.id,
          requirementTitle: selectedReq.title,
          recruiter: recruiterName,
          assignedDate: new Date().toLocaleString(),
          status: "Assigned",
        },
      ]);

      setShowAssignModal(false);
      setSelectedRecruiter("");
      setSelectedReq(null);

      alert("Recruiter assigned successfully!");

      refreshAllData();
    } catch (err) {
      console.error("Assign error:", err);
      alert("Server error");
    }
  };

  const handleDelete = async (req) => {
    if (!window.confirm(`Delete ${req.title}?`)) return;

    try {
      const res = await fetch(`http://localhost:5000/delete-requirement/${req.id}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to delete");
        return;
      }

      dispatch({
        type: "auth/setRequirements",
        payload: requirements.filter((r) => r.id !== req.id),
      });

      setAssignedList((prev) =>
        prev.filter((item) => item.requirementId !== req.id)
      );

      alert("Requirement deleted!");

      refreshAllData();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Server error");
    }
  };

  const refreshAllData = useCallback(async () => {
    try {
      const action = await dispatch(fetchRequirements());
      if (fetchRequirements.fulfilled.match(action)) {
        await fetchAssignedRecruiters(action.payload || []);
      } else if (requirements?.length) {
        await fetchAssignedRecruiters(requirements);
      } else {
        setAssignedList([]);
      }
    } catch (error) {
      console.error("Refresh error:", error);
    }
  }, [dispatch, requirements]);

  const filteredRequirements = selectedClient
    ? requirements.filter((r) => r.client_id === Number(selectedClient))
    : requirements;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Requirements
            </h2>
            <p className="text-gray-400 text-sm">Manage job requirements and assignments</p>
          </div>
          {canCreate && (
            <button
              onClick={() => navigate("/create-requirement")}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white rounded-xl hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-lg shadow-purple-500/50 font-semibold"
            >
              ➕ New Requirement
            </button>
          )}
        </div>

        {/* FILTER */}
        <div className="bg-gray-800/40 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-xl p-4">
          <select
            className="w-full bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            onChange={(e) => setSelectedClient(e.target.value)}
          >
            <option value="" className="bg-gray-800">All Clients</option>
            {clients?.map((c) => (
              <option key={c.id} value={c.id} className="bg-gray-800">
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading...</p>
          </div>
        )}

        {/* REQUIREMENTS TABLE */}
        {!loading && filteredRequirements.length > 0 && (
          <div className="bg-gray-800/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="p-3 text-left text-gray-300 font-semibold">Title</th>
                    <th className="p-3 text-left text-gray-300 font-semibold">Location</th>
                    <th className="p-3 text-left text-gray-300 font-semibold">Experience</th>
                    <th className="p-3 text-left text-gray-300 font-semibold">Skills</th>
                    <th className="p-3 text-left text-gray-300 font-semibold">Client</th>
                    <th className="p-3 text-left text-gray-300 font-semibold">Created By</th>
                    <th className="p-3 text-center text-gray-300 font-semibold">Status</th>
                    <th className="p-3 text-center text-gray-300 font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRequirements.map((req) => (
                    <tr key={req.id} className="border-t border-purple-500/20 hover:bg-gray-700/30 transition-colors">
                      <td className="p-3 text-gray-300">{req.title}</td>
                      <td className="p-3 text-gray-300">{req.location}</td>
                      <td className="p-3 text-gray-300">{req.experience_required} yrs</td>
                      <td className="p-3 text-gray-300">{req.skills_required}</td>
                      <td className="p-3 text-gray-300">
                        {clients.find((c) => c.id === req.client_id)?.name || "--"}
                      </td>
                      <td className="p-3 text-gray-300">{req.created_by}</td>

                      <td className="p-3 text-center">
                        <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-xs font-semibold">
                          {req.status}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        {canAssign && (
                          <button
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg text-xs mr-2 hover:from-blue-600 hover:to-cyan-600 transform hover:scale-105 transition-all font-semibold"
                            onClick={() => {
                              setSelectedReq(req);
                              setShowAssignModal(true);
                            }}
                          >
                            Assign
                          </button>
                        )}
                        <button
                          className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg text-xs hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all font-semibold"
                          onClick={() => handleDelete(req)}
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
        )}

        {/* ASSIGN MODAL */}
        {showAssignModal && (
          <AssignModal
            recruiters={recruiters}
            selectedRecruiter={selectedRecruiter}
            setSelectedRecruiter={setSelectedRecruiter}
            selectedReq={selectedReq}
            setShowAssignModal={setShowAssignModal}
            handleAssignConfirm={handleAssignConfirm}
          />
        )}

        {/* ASSIGNED TABLE */}
        <AssignedRecruitersTable assignedList={assignedList} />
      </div>
    </div>
  );
}

function AssignModal({
  recruiters,
  selectedRecruiter,
  setSelectedRecruiter,
  selectedReq,
  setShowAssignModal,
  handleAssignConfirm,
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 border border-purple-500/30 p-6 w-full max-w-md rounded-2xl shadow-2xl">
        <h2 className="text-xl font-bold mb-4 text-gray-300">
          Assign Recruiter for {selectedReq.title}
        </h2>

        <select
          className="w-full bg-gray-700/50 border border-purple-500/30 rounded-xl px-4 py-3 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          value={selectedRecruiter}
          onChange={(e) => setSelectedRecruiter(e.target.value)}
        >
          <option value="" className="bg-gray-800">Select Recruiter</option>
          {recruiters.map((r) => (
            <option key={r.id} value={r.id} className="bg-gray-800">
              {r.name}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-3">
          <button
            className="px-6 py-2 bg-gray-700/50 border border-purple-500/30 text-gray-300 rounded-xl hover:bg-gray-700/70 transition-all font-semibold"
            onClick={() => setShowAssignModal(false)}
          >
            Cancel
          </button>
          <button
            className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transform hover:scale-105 transition-all duration-300 shadow-lg shadow-emerald-500/50 font-semibold disabled:opacity-50"
            onClick={handleAssignConfirm}
            disabled={!selectedRecruiter}
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignedRecruitersTable({ assignedList }) {
  return (
    <div className="bg-gray-800/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-xl p-6">
      <h3 className="text-xl font-bold mb-4 text-gray-300 flex items-center gap-2">
        <span>👥</span>
        <span>Assigned Recruiters</span>
      </h3>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="p-3 text-left text-gray-300 font-semibold border-b border-purple-500/20">S.NO</th>
              <th className="p-3 text-left text-gray-300 font-semibold border-b border-purple-500/20">Recruiter</th>
              <th className="p-3 text-left text-gray-300 font-semibold border-b border-purple-500/20">Requirement</th>
              <th className="p-3 text-left text-gray-300 font-semibold border-b border-purple-500/20">Assigned Date</th>
              <th className="p-3 text-left text-gray-300 font-semibold border-b border-purple-500/20">Status</th>
            </tr>
          </thead>

          <tbody>
            {assignedList.length === 0 ? (
              <tr>
                <td className="p-6 text-center text-gray-400" colSpan="5">
                  No assignments yet
                </td>
              </tr>
            ) : (
              assignedList.map((item, i) => (
                <tr key={item.id} className="border-t border-purple-500/20 hover:bg-gray-700/30 transition-colors">
                  <td className="p-3 text-gray-300">{i + 1}</td>
                  <td className="p-3 text-gray-300">{item.recruiter}</td>
                  <td className="p-3 text-gray-300">{item.requirementTitle}</td>
                  <td className="p-3 text-gray-400 text-xs">{item.assignedDate}</td>
                  <td className="p-3">
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg text-xs font-semibold">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
