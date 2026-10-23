import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Landing } from './pages/Landing';
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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Landing Page */}
              <Route path="/" element={<Landing />} />

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
          <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
            DevPulse &copy; 2026 — GitHub Project Health & Collaboration Platform
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
