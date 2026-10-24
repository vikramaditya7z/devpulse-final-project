import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { repoApi } from '../services/api';
import {
  GitBranch,
  Star,
  GitFork,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  Activity,
  FolderGit2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Repository form state
  const [repoInput, setRepoInput] = useState('');
  const [addingRepo, setAddingRepo] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Delete confirmation modal state
  const [deletingId, setDeletingId] = useState(null);
  const [repoToDelete, setRepoToDelete] = useState(null);

  const fetchSavedRepos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await repoApi.getSavedRepos();
      setRepositories(data.repositories || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch saved repositories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedRepos();
  }, []);

  const handleAddRepo = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!repoInput.trim()) {
      setFormError('Please enter a GitHub repository (e.g. facebook/react or full URL).');
      return;
    }

    setAddingRepo(true);
    try {
      const data = await repoApi.saveRepo({ repoIdentifier: repoInput.trim() });
      setRepositories((prev) => [data.repository, ...prev]);
      setSuccessMessage(`Successfully added "${data.repository.fullName}" to your dashboard.`);
      setRepoInput('');
    } catch (err) {
      setFormError(err.message || 'Could not add repository.');
    } finally {
      setAddingRepo(false);
    }
  };

  const confirmDelete = (repo) => {
    setRepoToDelete(repo);
    setDeletingId(repo._id);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      await repoApi.deleteRepo(deletingId);
      setRepositories((prev) => prev.filter((r) => r._id !== deletingId));
      setSuccessMessage(`Removed "${repoToDelete?.fullName}" from your dashboard.`);
      setDeletingId(null);
      setRepoToDelete(null);
    } catch (err) {
      setError(err.message || 'Failed to remove repository.');
      setDeletingId(null);
      setRepoToDelete(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FolderGit2 className="w-6 h-6" />
            </span>
            Personal Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">
            Monitor public GitHub repositories, track pull request velocity, and detect collaboration bottlenecks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/workspaces"
            className="inline-flex items-center gap-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition"
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Team Workspaces</span>
          </Link>
          <Link
            to="/analyze"
            className="inline-flex items-center gap-2 text-xs font-medium bg-[#101625] hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-4 py-2.5 rounded-xl transition"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            Quick Analysis
          </Link>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-sm flex items-center justify-between shadow-lg">
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

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-sm flex items-center gap-2.5 shadow-lg">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add Public Repository Form */}
      <div className="bg-[#101625] border border-slate-800/80 rounded-2xl p-6 shadow-lg shadow-black/40">
        <h2 className="text-base font-semibold text-slate-100 mb-1 flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-400" />
          Add Public GitHub Repository
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Connect any public repository by typing <code className="text-emerald-400 font-mono bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/60">owner/repo</code> or pasting its full GitHub URL.
        </p>

        <form onSubmit={handleAddRepo} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            placeholder="e.g. facebook/react or https://github.com/torvalds/linux"
            className="flex-1 px-4 py-2.5 bg-[#0d121f] border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
          />
          <button
            type="submit"
            disabled={addingRepo}
            className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {addingRepo ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Verifying on GitHub...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add Repository</span>
              </>
            )}
          </button>
        </form>

        {formError && (
          <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{formError}</span>
          </div>
        )}
      </div>

      {/* Saved Repositories List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-emerald-400" />
            Saved Repositories ({repositories.length})
          </h2>
          <button
            onClick={fetchSavedRepos}
            className="text-xs text-slate-400 hover:text-slate-200 transition font-medium"
          >
            Refresh List
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-[#101625] border border-slate-800/80 rounded-2xl p-6 h-48 animate-pulse">
                <div className="h-5 bg-slate-800 rounded w-2/3 mb-3"></div>
                <div className="h-3 bg-slate-800/60 rounded w-full mb-2"></div>
                <div className="h-3 bg-slate-800/60 rounded w-4/5 mb-6"></div>
                <div className="h-8 bg-slate-800 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : repositories.length === 0 ? (
          <div className="bg-[#101625] border border-slate-800/80 rounded-2xl p-10 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-[#0d121f] border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
              <FolderGit2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">No Saved Repositories Yet</h3>
            <p className="text-sm text-slate-400 max-w-md mt-1 mb-5">
              Add your first public GitHub repository above to start monitoring pull request health, merged velocity, and bottlenecks.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Quick try:</span>
              <button
                onClick={() => setRepoInput('facebook/react')}
                className="text-emerald-400 hover:underline font-mono"
              >
                facebook/react
              </button>
              <span>•</span>
              <button
                onClick={() => setRepoInput('expressjs/express')}
                className="text-emerald-400 hover:underline font-mono"
              >
                expressjs/express
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {repositories.map((repo) => (
              <div
                key={repo._id}
                className="bg-[#101625] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 hover:shadow-xl hover:shadow-black/50 transition group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-bold text-slate-100 text-base group-hover:text-emerald-400 transition truncate">
                      {repo.fullName}
                    </span>
                    <button
                      onClick={() => confirmDelete(repo)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition"
                      title="Remove repository"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px] mb-4">
                    {repo.description || 'No description provided on GitHub.'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-5">
                    <span className="flex items-center gap-1 font-mono">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      {repo.stars?.toLocaleString() || 0}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <GitFork className="w-3.5 h-3.5 text-cyan-400" />
                      {repo.forks?.toLocaleString() || 0}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <GitBranch className="w-3.5 h-3.5 text-slate-500" />
                      {repo.defaultBranch || 'main'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition font-medium"
                  >
                    <span>GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <Link
                    to={`/repo/${repo._id}/health`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>View Health</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {repoToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#101625] border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl shadow-black">
            <h3 className="text-lg font-bold text-slate-100 mb-2">Remove Repository?</h3>
            <p className="text-xs text-slate-400 mb-6">
              Are you sure you want to remove <span className="font-semibold text-slate-200 font-mono">{repoToDelete.fullName}</span> from your personal dashboard? This will not affect the repository on GitHub.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setRepoToDelete(null);
                  setDeletingId(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 bg-[#0d121f] border border-slate-700/80 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 transition"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
