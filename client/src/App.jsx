import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { RepoHealth } from './pages/RepoHealth';
import { QuickAnalyze } from './pages/QuickAnalyze';
import { Workspaces } from './pages/Workspaces';
import { WorkspaceDetail } from './pages/WorkspaceDetail';
import { WorkspaceRepoHealth } from './pages/WorkspaceRepoHealth';
import { PersonalReports } from './pages/PersonalReports';
import { ReportDetail } from './pages/ReportDetail';
import { InviteAccept } from './pages/InviteAccept';
import { NotFound } from './pages/NotFound';

const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 selection:bg-emerald-500 selection:text-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Root index route */}
              <Route path="/" element={<RootRedirect />} />

              {/* Public Authentication routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Public Invitation preview / accept landing route */}
              <Route path="/invite/:token" element={<InviteAccept />} />

              {/* Protected Application routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/repo/:id/health" element={<RepoHealth />} />
                <Route path="/analyze" element={<QuickAnalyze />} />
                <Route path="/workspaces" element={<Workspaces />} />
                <Route path="/workspaces/:id" element={<WorkspaceDetail />} />
                <Route path="/workspaces/:id/repos/:repoId/health" element={<WorkspaceRepoHealth />} />
                <Route path="/reports" element={<PersonalReports />} />
                <Route path="/reports/:id" element={<ReportDetail />} />
              </Route>

              {/* 404 Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
            DevPulse &copy; 2026 — GitHub Project Health & Collaboration Platform
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
