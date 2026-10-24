import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { workspaceApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Shield,
  User,
  Plus,
  Trash2,
  Edit2,
  LogOut,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Link2,
  X,
  AlertTriangle,
  FolderGit2,
  FileText,
  Star,
  GitFork,
  GitBranch,
  Activity,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export const WorkspaceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('repos'); // 'repos' | 'reports' | 'members' | 'settings'
  const [workspace, setWorkspace] = useState(null);
  const [role, setRole] = useState(null);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [repos, setRepos] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState('');

  // Add Shared Repo form state
  const [repoInput, setRepoInput] = useState('');
  const [addingRepo, setAddingRepo] = useState(false);
  const [repoFormError, setRepoFormError] = useState('');

  // Delete repo modal state
  const [repoToDelete, setRepoToDelete] = useState(null);
  const [deletingRepo, setDeletingRepo] = useState(false);

  // Generate Report state
  const [generatingReportId, setGeneratingReportId] = useState(null);

  // Modals state
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameName, setRenameName] = useState('');
  const [renameDescription, setRenameDescription] = useState('');
  const [renaming, setRenaming] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [memberToRemove, setMemberToRemove] = useState(null);
  const [removingMember, setRemovingMember] = useState(false);

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Invite creation state
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [generatedInvite, setGeneratedInvite] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Parallel fetch of details, repos, and reports
      const [detailsData, reposData, reportsData] = await Promise.all([
        workspaceApi.getWorkspaceDetails(id),
        workspaceApi.getWorkspaceRepos(id).catch(() => ({ repositories: [] })),
        workspaceApi.getWorkspaceReports(id).catch(() => ({ reports: [] }))
      ]);

      setWorkspace(detailsData.workspace);
      setRole(detailsData.role);
      setMembers(detailsData.members || []);
      setRepos(reposData.repositories || []);
      setReports(reportsData.reports || []);

      // If Owner, also fetch invitations
      if (detailsData.role === 'owner') {
        try {
          const invData = await workspaceApi.listPendingInvitations(id);
          setInvitations(invData.invitations || []);
        } catch (invErr) {
          console.warn('Could not load invitations:', invErr.message);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load workspace details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [id]);

  const handleAddSharedRepo = async (e) => {
    e.preventDefault();
    setRepoFormError('');
    if (!repoInput.trim()) {
      setRepoFormError('Please enter a valid repository identifier (e.g. facebook/react).');
      return;
    }

    setAddingRepo(true);
    try {
      const data = await workspaceApi.addWorkspaceRepo(id, { repoIdentifier: repoInput.trim() });
      setRepos((prev) => [data.repository, ...prev]);
      setNotification(`Added "${data.repository.fullName}" to workspace.`);
      setRepoInput('');
    } catch (err) {
      setRepoFormError(err.message || 'Could not add repository to workspace.');
    } finally {
      setAddingRepo(false);
    }
  };

  const handleDeleteSharedRepo = async () => {
    if (!repoToDelete) return;
    setDeletingRepo(true);
    try {
      await workspaceApi.deleteWorkspaceRepo(id, repoToDelete._id);
      setRepos((prev) => prev.filter((r) => r._id !== repoToDelete._id));
      setNotification(`Removed "${repoToDelete.fullName}" from workspace.`);
      setRepoToDelete(null);
    } catch (err) {
      setError(err.message || 'Failed to remove repository.');
      setRepoToDelete(null);
    } finally {
      setDeletingRepo(false);
    }
  };

  const handleGenerateWorkspaceReport = async (repoId) => {
    setGeneratingReportId(repoId);
    setError(null);
    try {
      const data = await workspaceApi.generateWorkspaceReport(id, repoId);
      setReports((prev) => [data.report, ...prev]);
      setNotification(`Persistent report generated for ${data.report.repository.fullName}!`);
      setActiveTab('reports');
    } catch (err) {
      setError(err.message || 'Failed to generate persistent report.');
    } finally {
      setGeneratingReportId(null);
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!renameName.trim()) return;

    setRenaming(true);
    try {
      const data = await workspaceApi.renameWorkspace(id, {
        name: renameName.trim(),
        description: renameDescription.trim()
      });
      setWorkspace(data.workspace);
      setIsRenameModalOpen(false);
      setNotification('Workspace renamed successfully.');
    } catch (err) {
      setError(err.message || 'Failed to rename workspace.');
    } finally {
      setRenaming(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    setDeleting(true);
    try {
      await workspaceApi.deleteWorkspace(id);
      navigate('/workspaces');
    } catch (err) {
      setError(err.message || 'Failed to delete workspace.');
      setIsDeleteModalOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    setRemovingMember(true);
    try {
      await workspaceApi.removeMember(id, memberToRemove.user._id);
      setMembers((prev) => prev.filter((m) => m.user._id !== memberToRemove.user._id));
      setNotification(`Member ${memberToRemove.user.name} removed from workspace.`);
      setMemberToRemove(null);
    } catch (err) {
      setError(err.message || 'Failed to remove member.');
      setMemberToRemove(null);
    } finally {
      setRemovingMember(false);
    }
  };

  const handleLeaveWorkspace = async () => {
    setLeaving(true);
    try {
      await workspaceApi.leaveWorkspace(id);
      navigate('/workspaces');
    } catch (err) {
      setError(err.message || 'Failed to leave workspace.');
      setIsLeaveModalOpen(false);
    } finally {
      setLeaving(false);
    }
  };

  const handleGenerateInvite = async () => {
    setGeneratingInvite(true);
    setError(null);
    try {
      const data = await workspaceApi.createInvitation(id);
      setGeneratedInvite(data.invitation);
      const invData = await workspaceApi.listPendingInvitations(id);
      setInvitations(invData.invitations || []);
    } catch (err) {
      setError(err.message || 'Failed to generate invitation link.');
    } finally {
      setGeneratingInvite(false);
    }
  };

  const handleCopyInvite = (url) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRevokeInvite = async (inviteId) => {
    try {
      await workspaceApi.revokeInvitation(id, inviteId);
      setInvitations((prev) => prev.filter((i) => i._id !== inviteId));
      setNotification('Invitation link revoked.');
    } catch (err) {
      setError(err.message || 'Failed to revoke invitation.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-slate-400 text-sm font-medium">Loading workspace dashboard...</span>
      </div>
    );
  }

  if (error && !workspace) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          to="/workspaces"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Workspaces
        </Link>
        <div className="bg-[#101625] border border-rose-500/30 rounded-2xl p-8 text-center flex flex-col items-center shadow-xl">
          <AlertCircle className="w-10 h-10 text-rose-400 mb-3" />
          <h3 className="text-lg font-bold text-slate-100 mb-1">Access Denied or Not Found</h3>
          <p className="text-sm text-rose-300 max-w-md mb-6">{error}</p>
          <Link
            to="/workspaces"
            className="px-4 py-2 bg-[#0d121f] hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/80 transition"
          >
            Return to Workspaces
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = role === 'owner';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      {/* Breadcrumb & Workspace Title */}
      <div>
        <Link
          to="/workspaces"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 mb-3 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Workspaces
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
                {workspace.name}
              </h1>

              {isOwner ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  <Shield className="w-3.5 h-3.5" />
                  Owner
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  <User className="w-3.5 h-3.5" />
                  Member
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              {workspace.description || 'Shared collaboration workspace for team health monitoring.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isOwner && (
              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3.5 py-2 rounded-xl transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Leave Workspace</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification('')}
            className="text-emerald-400 hover:text-emerald-200 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2.5 shadow-lg">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Workspace Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800">
        <button
          onClick={() => setActiveTab('repos')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-semibold transition ${
            activeTab === 'repos'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          <span>Shared Repositories ({repos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-semibold transition ${
            activeTab === 'reports'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Persistent Reports ({reports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-semibold transition ${
            activeTab === 'members'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Members &amp; Invites ({members.length})</span>
        </button>

        {isOwner && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-semibold transition ${
              activeTab === 'settings'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit2 className="w-4 h-4" />
            <span>Workspace Settings</span>
          </button>
        )}
      </div>

      {/* TAB 1: Shared Repositories */}
      {activeTab === 'repos' && (
        <div className="space-y-6">
          {/* Add Repository to Workspace Form */}
          <div className="bg-[#101625] border border-slate-800/80 rounded-2xl p-5 shadow-lg shadow-black/40">
            <h2 className="text-sm font-semibold text-slate-100 mb-1.5 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              Add Repository to Workspace
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              All workspace members can view health metrics and generate snapshot reports for shared repositories.
            </p>

            <form onSubmit={handleAddSharedRepo} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="e.g. facebook/react or https://github.com/expressjs/express"
                className="flex-1 px-4 py-2 bg-[#0d121f] border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
              <button
                type="submit"
                disabled={addingRepo}
                className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 shrink-0"
              >
                {addingRepo ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Verifying on GitHub...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Workspace</span>
                  </>
                )}
              </button>
            </form>

            {repoFormError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{repoFormError}</span>
              </div>
            )}
          </div>

          {/* Repositories Grid */}
          <div>
            {repos.length === 0 ? (
              <div className="bg-[#101625] border border-slate-800/80 rounded-2xl p-10 text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-[#0c101a] border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
                  <FolderGit2 className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-slate-100">No Shared Repositories</h3>
                <p className="text-sm text-slate-400 max-w-md mt-1 mb-4">
                  Add public GitHub repositories to this workspace so team members can monitor collaboration bottlenecks together.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {repos.map((repo) => (
                  <div
                    key={repo._id}
                    className="bg-[#101625] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 hover:shadow-xl hover:shadow-black/50 transition group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="font-bold text-slate-100 text-base group-hover:text-emerald-400 transition truncate">
                          {repo.fullName}
                        </span>

                        {isOwner && (
                          <button
                            onClick={() => setRepoToDelete(repo)}
                            className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition"
                            title="Remove repository from workspace"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px] mb-4">
                        {repo.description || 'Public GitHub Repository'}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-slate-400 mb-4 font-mono">
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          {repo.stars?.toLocaleString() || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitFork className="w-3.5 h-3.5 text-cyan-400" />
                          {repo.forks?.toLocaleString() || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitBranch className="w-3.5 h-3.5 text-slate-500" />
                          {repo.defaultBranch || 'main'}
                        </span>
                      </div>

                      {repo.addedBy && (
                        <div className="text-[11px] text-slate-500 mb-4 font-mono">
                          Added by {repo.addedBy.name || repo.addedBy.email}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <Link
                        to={`/workspaces/${id}/repos/${repo._id}/health`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg transition"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>View Health</span>
                      </Link>

                      <button
                        onClick={() => handleGenerateWorkspaceReport(repo._id)}
                        disabled={generatingReportId === repo._id}
                        className="inline-flex items-center gap-1 text-xs font-semibold bg-[#0d121f] hover:bg-slate-800 text-slate-300 border border-slate-700/80 px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
                        title="Save immutable snapshot report for this repository"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{generatingReportId === repo._id ? 'Generating...' : 'Save Report'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Workspace Persistent Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                Persistent Workspace Reports ({reports.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Saved immutable snapshots capturing metrics and explainable bottleneck findings at the moment of generation.
              </p>
            </div>
          </div>

          {reports.length === 0 ? (
            <div className="bg-[#101625] border border-slate-800/80 rounded-2xl p-10 text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-[#0c101a] border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">No Reports Saved Yet</h3>
              <p className="text-sm text-slate-400 max-w-md mt-1 mb-4">
                Click "Save Report" on any shared repository above to generate and preserve a permanent snapshot of health metrics.
              </p>
            </div>
          ) : (
            <div className="bg-[#101625] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl shadow-black/50">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#0c101a] text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800 font-mono">
                    <tr>
                      <th className="py-3 px-4">Repository</th>
                      <th className="py-3 px-4">Health Score</th>
                      <th className="py-3 px-4">Open PRs / Merged</th>
                      <th className="py-3 px-4">Bottlenecks Flagged</th>
                      <th className="py-3 px-4">Generated By</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {reports.map((rep) => (
                      <tr key={rep._id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-bold text-slate-100 font-mono">
                          {rep.repository?.fullName}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className={`font-bold ${
                            rep.metrics?.healthScore >= 75
                              ? 'text-emerald-400'
                              : rep.metrics?.healthScore >= 50
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}>
                            {rep.metrics?.healthScore} / 100
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1.5 font-sans">({rep.metrics?.healthStatus})</span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono">
                          {rep.metrics?.openPullRequestsCount} open / {rep.metrics?.mergedPullRequestsCount} merged
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-amber-400 font-mono">
                            {rep.findings?.length || 0} findings
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {rep.createdBy?.name || 'Workspace Member'}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono">
                          {new Date(rep.generatedAt).toLocaleDateString()}{' '}
                          {new Date(rep.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/reports/${rep._id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg transition"
                          >
                            <span>View Snapshot</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Members & Invites */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          {/* Owner-Only: Invitation Generator & Manager */}
          {isOwner && (
            <div className="bg-[#101625] border border-slate-800/80 rounded-2xl p-6 shadow-lg shadow-black/40 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-emerald-400" />
                    Invite Team Members
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Generate single-use invitation links that expire after 48 hours. Only SHA-256 hashes are stored in the database.
                  </p>
                </div>

                <button
                  onClick={handleGenerateInvite}
                  disabled={generatingInvite}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{generatingInvite ? 'Generating...' : 'Create Invite Link'}</span>
                </button>
              </div>

              {/* Generated Link Card */}
              {generatedInvite && (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-300">Single-Use Link Ready</span>
                      <span className="text-[10px] text-emerald-500">•</span>
                      <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        Expires in 48 hours
                      </span>
                    </div>
                    <div className="text-xs text-slate-200 font-mono break-all select-all">
                      {generatedInvite.inviteUrl}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyInvite(generatedInvite.inviteUrl)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3.5 py-1.5 rounded-lg shadow-sm transition shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Pending Invitations Table */}
              {invitations.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 font-mono">
                    Active Pending Invitations ({invitations.length})
                  </h3>

                  <div className="border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-[#0c101a] text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800 font-mono">
                        <tr>
                          <th className="py-2.5 px-4">Created Date</th>
                          <th className="py-2.5 px-4">Invited By</th>
                          <th className="py-2.5 px-4">Expires</th>
                          <th className="py-2.5 px-4">Status</th>
                          <th className="py-2.5 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {invitations.map((inv) => (
                          <tr key={inv._id} className="hover:bg-slate-800/30 transition">
                            <td className="py-2.5 px-4">{new Date(inv.createdAt).toLocaleDateString()}</td>
                            <td className="py-2.5 px-4">{inv.invitedBy?.name || 'Owner'}</td>
                            <td className="py-2.5 px-4 text-slate-400">
                              {new Date(inv.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                              {new Date(inv.expiresAt).toLocaleDateString()}
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                {inv.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <button
                                onClick={() => handleRevokeInvite(inv._id)}
                                className="text-xs font-semibold text-rose-400 hover:text-rose-300 hover:underline"
                              >
                                Revoke
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Members Table */}
          <div className="bg-[#101625] border border-slate-800/80 rounded-2xl p-6 shadow-lg shadow-black/40">
            <h2 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Workspace Members ({members.length})
            </h2>

            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#0c101a] text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800 font-mono">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Joined Date</th>
                    {isOwner && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {members.map((m) => {
                    const isMemberOwner = m.role === 'owner';
                    const isSelf = m.user?._id === user?.id;

                    return (
                      <tr key={m._id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-bold text-slate-100 flex items-center gap-2">
                          <span>{m.user?.name || 'Team Member'}</span>
                          {isSelf && <span className="text-[10px] font-mono text-emerald-400">(You)</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono">{m.user?.email}</td>
                        <td className="py-3 px-4">
                          {isMemberOwner ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                              <Shield className="w-3 h-3" />
                              Owner
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                              <User className="w-3 h-3" />
                              Member
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono">
                          {new Date(m.joinedAt).toLocaleDateString()}
                        </td>

                        {isOwner && (
                          <td className="py-3 px-4 text-right">
                            {!isMemberOwner && (
                              <button
                                onClick={() => setMemberToRemove(m)}
                                className="text-xs font-semibold text-rose-400 hover:text-rose-300 hover:underline"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Workspace Settings (Owner Only) */}
      {activeTab === 'settings' && isOwner && (
        <div className="space-y-6">
          <div className="bg-[#101625] border border-slate-800/80 rounded-2xl p-6 shadow-lg shadow-black/40">
            <h2 className="text-base font-bold text-slate-100 mb-2">Workspace Administration</h2>
            <p className="text-xs text-slate-400 mb-6">
              Manage workspace metadata or delete the workspace and associated resources permanently.
            </p>

            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setRenameName(workspace.name);
                  setRenameDescription(workspace.description || '');
                  setIsRenameModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#0d121f] hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-4 py-2 rounded-xl transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Rename Workspace</span>
              </button>

              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 px-4 py-2 rounded-xl transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Workspace</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Shared Repo Modal */}
      {repoToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#101625] border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-2">Remove Shared Repository?</h3>
            <p className="text-xs text-slate-400 mb-6">
              Are you sure you want to remove <span className="font-semibold text-slate-200 font-mono">{repoToDelete.fullName}</span> from this workspace? Members will no longer see it in this workspace.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setRepoToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 bg-[#0d121f] border border-slate-700/80 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSharedRepo}
                disabled={deletingRepo}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
              >
                {deletingRepo ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {isRenameModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#101625] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-emerald-400" />
                Rename Workspace
              </h3>
              <button
                onClick={() => setIsRenameModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRename} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Workspace Name *
                </label>
                <input
                  type="text"
                  required
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0d121f] border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={renameDescription}
                  onChange={(e) => setRenameDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0d121f] border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRenameModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 bg-[#0d121f] border border-slate-700/80 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renaming}
                  className="px-5 py-2 text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                >
                  {renaming ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Workspace Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#101625] border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              Delete Workspace?
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              This will permanently delete <span className="font-semibold text-slate-200">{workspace.name}</span> and remove all member access and active invitations.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 bg-[#0d121f] border border-slate-700/80 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteWorkspace}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#101625] border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-2">Remove Member?</h3>
            <p className="text-xs text-slate-400 mb-6">
              Are you sure you want to remove <span className="font-semibold text-slate-200">{memberToRemove.user?.name}</span> from this workspace?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setMemberToRemove(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 bg-[#0d121f] border border-slate-700/80 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveMember}
                disabled={removingMember}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
              >
                {removingMember ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Workspace Confirmation Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#101625] border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-2">Leave Workspace?</h3>
            <p className="text-xs text-slate-400 mb-6">
              Are you sure you want to leave <span className="font-semibold text-slate-200">{workspace.name}</span>?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsLeaveModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 bg-[#0d121f] border border-slate-700/80 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveWorkspace}
                disabled={leaving}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
              >
                {leaving ? 'Leaving...' : 'Confirm Leave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
