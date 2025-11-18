import React, { useState, Fragment } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../auth/authSlice";

function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s) => s.auth);
  const [open, setOpen] = useState(false);

  const role = user?.role || "PUBLIC";
  const isAuthPage = location.pathname === "/" || location.pathname === "/signup";

  const MENUS = {
    ADMIN: [
      { to: "/admin-dashboard", label: "Dashboard", icon: "📊" },
      { to: "/users", label: "Users", icon: "👥" },
      { to: "/clients", label: "Clients", icon: "🏢" },
      { to: "/requirements", label: "Requirements", icon: "📋" },
      { to: "/candidates", label: "Candidates", icon: "🎯" },
      { to: "/create-requirement", label: "Create", icon: "➕" },
    ],
    DELIVERY_MANAGER: [
      { to: "/dm-dashboard", label: "Dashboard", icon: "📊" },
      { to: "/requirements", label: "Requirements", icon: "📋" },
      { to: "/create-requirement", label: "Create", icon: "➕" },
      { to: "/candidates", label: "Candidates", icon: "🎯" },
    ],
    RECRUITER: [
      { to: "/recruiter-dashboard", label: "Dashboard", icon: "📊" },
      { to: "/candidates", label: "Candidates", icon: "🎯" },
    ],
  };

  const menuItems = MENUS[role] || [];

  const handleLogout = () => {
    dispatch(logoutUser()).then(() => navigate("/"));
  };

  if (isAuthPage) {
    return (
      <nav className="bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 border-b border-purple-500/20 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 rounded-xl text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-purple-500/50 transform group-hover:scale-110 transition-all duration-300">
              R
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              RecruitPro ATS
            </span>
          </div>
          <div className="flex gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-purple-500/50"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`
              }
            >
              Login
            </NavLink>
            <NavLink
              to="/signup"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-pink-500/50"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`
              }
            >
              Register
            </NavLink>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 border-b border-purple-500/20 sticky top-0 z-50 backdrop-blur-xl shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => {
              if (role === "ADMIN") navigate("/admin-dashboard");
              else if (role === "DELIVERY_MANAGER") navigate("/dm-dashboard");
              else navigate("/recruiter-dashboard");
            }}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 rounded-xl text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-purple-500/50 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
              R
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              RecruitPro ATS
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-purple-500/50 transform scale-105"
                      : "text-gray-300 hover:text-white hover:bg-white/10 hover:scale-105"
                  }`
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-purple-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">{user.name}</span>
                <span className="text-xs text-purple-400 font-semibold">{user.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 shadow-lg shadow-red-500/30 transform hover:scale-105 transition-all duration-300"
              >
                Logout
              </button>
            </div>
          )}

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-gray-300 hover:text-white p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {open && (
          <div className="md:hidden pb-4 space-y-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`
                }
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Header;
