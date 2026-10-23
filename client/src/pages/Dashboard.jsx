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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            Personal Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor public GitHub repositories, track pull request velocity, and detect collaboration bottlenecks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/workspaces"
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg shadow-sm transition"
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Team Workspaces</span>
          </Link>
          <Link
            to="/analyze"
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-lg transition"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            Quick On-Demand Analysis
          </Link>
        </div>
      </div>

      {/* Success Notification */}
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

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add Public Repository Form */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-400" />
          Add Public GitHub Repository
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Connect any public repository by typing <code className="text-emerald-300">owner/repo</code> or pasting its full GitHub URL.
        </p>

        <form onSubmit={handleAddRepo} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            placeholder="e.g. facebook/react or https://github.com/torvalds/linux"
            className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
          <button
            type="submit"
            disabled={addingRepo}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm px-5 py-2.5 rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {addingRepo ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
          <div className="mt-3 p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{formError}</span>
          </div>
        )}
      </div>

      {/* Saved Repositories List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-emerald-400" />
            Saved Repositories ({repositories.length})
          </h2>
          <button
            onClick={fetchSavedRepos}
            className="text-xs text-slate-400 hover:text-slate-200 transition"
          >
            Refresh List
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-slate-800/40 border border-slate-800 rounded-xl p-5 h-44 animate-pulse">
                <div className="h-5 bg-slate-700 rounded w-2/3 mb-3"></div>
                <div className="h-3 bg-slate-700 rounded w-full mb-2"></div>
                <div className="h-3 bg-slate-700 rounded w-4/5 mb-6"></div>
                <div className="h-8 bg-slate-700 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : repositories.length === 0 ? (
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-10 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mb-3">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">No Saved Repositories Yet</h3>
            <p className="text-sm text-slate-400 max-w-md mt-1 mb-4">
              Add your first public GitHub repository above to start monitoring pull request health, merged velocity, and bottlenecks.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Suggestions:</span>
              <button
                onClick={() => setRepoInput('facebook/react')}
                className="text-emerald-400 hover:underline"
              >
                facebook/react
              </button>
              <span>•</span>
              <button
                onClick={() => setRepoInput('expressjs/express')}
                className="text-emerald-400 hover:underline"
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
                className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between hover:border-slate-600 transition shadow-sm group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-bold text-white text-base group-hover:text-emerald-400 transition truncate">
                      {repo.fullName}
                    </span>
                    <button
                      onClick={() => confirmDelete(repo)}
                      className="text-slate-500 hover:text-red-400 p-1 rounded transition"
                      title="Remove repository"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px] mb-4">
                    {repo.description || 'No description provided on GitHub.'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-5">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      {repo.stars?.toLocaleString() || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="w-3.5 h-3.5 text-blue-400" />
                      {repo.forks?.toLocaleString() || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                      {repo.defaultBranch || 'main'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between">
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
                  >
                    <span>GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <Link
                    to={`/repo/${repo._id}/health`}
                    className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg shadow-sm transition"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Remove Repository?</h3>
            <p className="text-xs text-slate-300 mb-6">
              Are you sure you want to remove <span className="font-semibold text-white">{repoToDelete.fullName}</span> from your personal dashboard? This will not affect the repository on GitHub.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setRepoToDelete(null);
                  setDeletingId(null);
                }}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg shadow transition"
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
