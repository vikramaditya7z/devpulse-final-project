import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { workspaceApi } from '../services/api';
import {
  Users,
  Plus,
  Shield,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Calendar,
  X
} from 'lucide-react';

export const Workspaces = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Create Workspace modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workspaceApi.getUserWorkspaces();
      setWorkspaces(data.workspaces || []);
    } catch (err) {
      setError(err.message || 'Failed to load team workspaces.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!name.trim()) {
      setModalError('Workspace name is required.');
      return;
    }

    if (name.trim().length < 2 || name.trim().length > 80) {
      setModalError('Workspace name must be between 2 and 80 characters long.');
      return;
    }

    setCreating(true);
    try {
      const data = await workspaceApi.createWorkspace({
        name: name.trim(),
        description: description.trim()
      });
      setSuccessMessage(`Workspace "${data.workspace.name}" created successfully!`);
      setName('');
      setDescription('');
      setIsModalOpen(false);
      fetchWorkspaces();
    } catch (err) {
      setModalError(err.message || 'Failed to create workspace.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-400" />
            Team Workspaces
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Collaborate with student teammates or engineering peers using single-use invite links and role-based access control.
          </p>
        </div>

        <div>
          <button
            onClick={() => {
              setModalError('');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Workspace</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-200 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-emerald-400 hover:text-emerald-200 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Workspaces List */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-slate-800/40 border border-slate-800 rounded-xl p-6 h-44 animate-pulse">
                <div className="h-5 bg-slate-700 rounded w-1/2 mb-3"></div>
                <div className="h-3 bg-slate-700 rounded w-full mb-2"></div>
                <div className="h-3 bg-slate-700 rounded w-3/4 mb-6"></div>
                <div className="h-8 bg-slate-700 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">No Team Workspaces Yet</h3>
            <p className="text-sm text-slate-400 max-w-md mt-1 mb-6">
              Create a team workspace to invite teammates with secure single-use 48-hour links, manage member roles, and share repository health visibility.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Workspace</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {workspaces.map((ws) => (
              <div
                key={ws._id}
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 flex flex-col justify-between hover:border-slate-600 transition shadow-sm group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-white text-lg group-hover:text-emerald-400 transition truncate">
                      {ws.name}
                    </h3>

                    {ws.role === 'owner' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                        <Shield className="w-3 h-3" />
                        Owner
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                        <User className="w-3 h-3" />
                        Member
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px] mb-5">
                    {ws.description || 'No workspace description provided.'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-6">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {ws.memberCount} {ws.memberCount === 1 ? 'member' : 'members'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Joined {new Date(ws.joinedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    {ws.role === 'owner' ? 'Full Admin Rights' : 'Member Access'}
                  </span>

                  <Link
                    to={`/workspaces/${ws._id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-700 hover:bg-emerald-600 text-white px-3.5 py-1.5 rounded-lg transition"
                  >
                    <span>View Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Create New Workspace
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Workspace Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Senior Capstone Team 4"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of project goals or team members..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow transition disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
