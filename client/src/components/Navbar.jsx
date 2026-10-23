import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, LogOut, User as UserIcon, LayoutDashboard, Search, Users, FileText } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to={isAuthenticated ? '/dashboard' : '/login'} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              DevPulse
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                v1.0
              </span>
            </span>
          </div>
        </Link>

        {/* Navigation links & User actions */}
        <nav className="flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-300 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-slate-800 transition"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-400" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/workspaces"
                className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-300 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-slate-800 transition"
              >
                <Users className="w-4 h-4 text-slate-400" />
                <span>Workspaces</span>
              </Link>

              <Link
                to="/reports"
                className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-300 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-slate-800 transition"
              >
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Reports</span>
              </Link>

              <Link
                to="/analyze"
                className="hidden md:flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-300 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-slate-800 transition"
              >
                <Search className="w-4 h-4 text-slate-400" />
                <span>Analyze</span>
              </Link>

              <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

              {/* User Profile Pill */}
              <div className="hidden lg:flex items-center gap-2 text-xs bg-slate-800/80 border border-slate-700/60 rounded-full py-1 px-3 text-slate-300">
                <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-medium text-white">{user?.name}</span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-900/40 border border-red-900/50 py-1.5 px-3 rounded-lg transition"
                title="Log out of DevPulse"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-md hover:bg-slate-800 transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg shadow-sm transition"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
