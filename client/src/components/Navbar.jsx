import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, LogOut, User as UserIcon, LayoutDashboard, Search, Users, FileText, GitCompare } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navLinkClass = (path) =>
    `flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg transition ${
      isActive(path)
        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
    }`;

  return (
    <header className="border-b border-slate-800/80 bg-[#0c101a]/85 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/50 transition shadow-sm shadow-emerald-950/40">
            <Activity className="w-5 h-5 transition-transform group-hover:scale-105" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              DevPulse
              <span className="text-[10px] uppercase font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                v3.0
              </span>
            </span>
          </div>
        </Link>

        {/* Navigation links & User actions */}
        <nav className="flex items-center gap-1.5 sm:gap-2.5">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                <span>Dashboard</span>
              </Link>

              <Link to="/workspaces" className={navLinkClass('/workspaces')}>
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Workspaces</span>
              </Link>

              <Link to="/reports" className={navLinkClass('/reports')}>
                <FileText className="w-4 h-4 text-violet-400" />
                <span>Reports</span>
              </Link>

              <Link to="/reports/compare" className={navLinkClass('/reports/compare')}>
                <GitCompare className="w-4 h-4 text-cyan-400" />
                <span>Compare</span>
              </Link>

              <Link to="/analyze" className={navLinkClass('/analyze')}>
                <Search className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Analyze</span>
              </Link>

              <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

              {/* User Profile Pill */}
              <div className="hidden lg:flex items-center gap-2 text-xs bg-slate-800/60 border border-slate-700/60 rounded-full py-1 px-3 text-slate-300">
                <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-medium text-slate-200">{user?.name}</span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 py-1.5 px-3 rounded-lg transition"
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
                className="text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800/60 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg shadow-sm shadow-emerald-950/50 hover:shadow-emerald-900/40 border border-emerald-500/40 transition"
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
