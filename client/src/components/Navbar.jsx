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
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-slate-900 flex items-center gap-1.5">
              DevPulse
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
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
                className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-500" />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/workspaces"
                className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition"
              >
                <Users className="w-4 h-4 text-slate-500" />
                <span>Workspaces</span>
              </Link>

              <Link
                to="/reports"
                className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Reports</span>
              </Link>

              <Link
                to="/analyze"
                className="hidden md:flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-md hover:bg-slate-100 transition"
              >
                <Search className="w-4 h-4 text-slate-500" />
                <span>Analyze</span>
              </Link>

              <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

              {/* User Profile Pill */}
              <div className="hidden lg:flex items-center gap-2 text-xs bg-slate-100 border border-slate-200 rounded-full py-1 px-3 text-slate-700">
                <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium text-slate-900">{user?.name}</span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs font-medium text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 py-1.5 px-3 rounded-lg transition"
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
                className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-100 transition"
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
