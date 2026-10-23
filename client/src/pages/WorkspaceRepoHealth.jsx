import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { workspaceApi } from '../services/api';
import { MetricCard } from '../components/MetricCard';
import { FindingsSection } from '../components/FindingsSection';
import { RateLimitBanner } from '../components/RateLimitBanner';
import {
  ArrowLeft,
  RefreshCw,
  GitPullRequest,
  CheckCircle2,
  Clock,
  GitCommit,
  AlertCircle,
  ExternalLink,
  Star,
  GitFork,
  Activity,
  AlertTriangle,
  FileText
} from 'lucide-react';

export const WorkspaceRepoHealth = () => {
  const { id: workspaceId, repoId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [reportSaved, setReportSaved] = useState(false);
  const [error, setError] = useState(null);
  const [errorObj, setErrorObj] = useState(null);
  const [notification, setNotification] = useState('');

  const fetchHealth = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      setErrorObj(null);

      const result = await workspaceApi.getWorkspaceRepoHealth(workspaceId, repoId);
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to fetch repository health metrics.');
      setErrorObj(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, [workspaceId, repoId]);

  const handleSavePersistentReport = async () => {
    setSavingReport(true);
    setNotification('');
    try {
      const result = await workspaceApi.generateWorkspaceReport(workspaceId, repoId);
      setReportSaved(true);
      setNotification(`Persistent report successfully generated!`);
      // Navigate to the saved report after short delay or direct link
    } catch (err) {
      setError(err.message || 'Failed to save persistent report.');
    } finally {
      setSavingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-300 font-medium text-sm">Analyzing shared repository data from GitHub...</p>
        <p className="text-slate-500 text-xs mt-1">Evaluating pull request velocity and bottleneck health</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          to={`/workspaces/${workspaceId}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Workspace
        </Link>
        <RateLimitBanner error={errorObj} onRetry={() => fetchHealth()} />
        <div className="bg-red-950/40 border border-red-800 rounded-xl p-8 text-center flex flex-col items-center">
          <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">Analysis Unavailable</h3>
          <p className="text-sm text-red-200 max-w-md mb-6">{error || 'Repository details could not be loaded.'}</p>
          <button
            onClick={() => fetchHealth()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  const { repository, analysis } = data;
  const { metrics, findings } = analysis;

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Breadcrumb */}
      <div>
        <Link
          to={`/workspaces/${workspaceId}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Workspace
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {repository.fullName}
              </h1>
              <a
                href={repository.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-md transition"
              >
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Workspace Shared Repo
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              {repository.description || 'Public GitHub Repository'}
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-400 mt-3">
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                {repository.stars?.toLocaleString()} stars
              </span>
              <span className="flex items-center gap-1">
                <GitFork className="w-3.5 h-3.5 text-blue-400" />
                {repository.forks?.toLocaleString()} forks
              </span>
              <span className="text-slate-500">•</span>
              <span>Default Branch: <code className="text-slate-300">{repository.defaultBranch}</code></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSavePersistentReport}
              disabled={savingReport || reportSaved}
              className="inline-flex items-center gap-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{savingReport ? 'Saving Snapshot...' : reportSaved ? 'Report Saved!' : 'Save Persistent Report'}</span>
            </button>

            <button
              onClick={() => fetchHealth(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Metrics'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-200 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
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

      {/* Primary Health Score Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
        <div className="flex items-start sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center shrink-0">
            <span className={`text-2xl font-black ${getScoreColor(metrics.healthScore)}`}>
              {metrics.healthScore}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">/ 100</span>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-white">Repository Health Score</h2>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                metrics.healthScore >= 75
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : metrics.healthScore >= 50
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {metrics.healthStatus}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Calculated deterministically from open pull request turnover velocity, issue activity staleness, and default branch commits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-700/80 pt-4 md:pt-0 md:pl-8 text-xs text-slate-400">
          <div>
            <div className="text-slate-500 uppercase text-[10px] font-semibold">Analyzed At</div>
            <div className="text-slate-300 font-medium mt-0.5">
              {new Date(analysis.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div>
            <div className="text-slate-500 uppercase text-[10px] font-semibold">Analysis Window</div>
            <div className="text-slate-300 font-medium mt-0.5">Past 30 Days</div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Repository Vitals
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Open Issues"
            value={metrics.openIssuesCount}
            subtitle="Excluding pull requests"
            icon={AlertCircle}
            color="amber"
          />

          <MetricCard
            title="Open PRs"
            value={metrics.openPullRequestsCount}
            subtitle="Pending integration"
            icon={GitPullRequest}
            color="blue"
          />

          <MetricCard
            title="Merged PRs"
            value={metrics.mergedPullRequestsCount}
            subtitle="Merged past 30 days"
            icon={CheckCircle2}
            color="emerald"
          />

          <MetricCard
            title="Avg Merge Time"
            value={`${metrics.averagePRMergeTimeHours}h`}
            subtitle="Turnaround velocity"
            icon={Clock}
            color="purple"
          />

          <MetricCard
            title="Recent Commits"
            value={metrics.recentCommitsCount}
            subtitle="Default branch activity"
            icon={GitCommit}
            color="rose"
          />
        </div>
      </div>

      {/* Bottlenecks Section */}
      <div className="pt-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          Identified Collaboration Bottlenecks ({findings.length})
        </h3>
        <FindingsSection findings={findings} />
      </div>
    </div>
  );
};
