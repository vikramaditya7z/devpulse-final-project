import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { repoApi, reportApi } from '../services/api';
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

export const RepoHealth = () => {
  const { id } = useParams();
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

      const result = await repoApi.getRepoHealth(id);
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to fetch repository health metrics.');
      setErrorObj(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSavePersistentReport = async () => {
    try {
      setSavingReport(true);
      setError(null);
      await reportApi.generatePersonalReport(savedRepository._id);
      setReportSaved(true);
      setNotification('Persistent health report snapshot generated successfully!');
      setTimeout(() => setNotification(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to save persistent report snapshot.');
    } finally {
      setSavingReport(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-800 font-semibold text-sm">Analyzing live GitHub repository data...</p>
        <p className="text-slate-500 text-xs mt-1">Evaluating pull requests, issues, and commit velocity</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <RateLimitBanner error={errorObj} onRetry={() => fetchHealth()} />
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center flex flex-col items-center shadow-xs">
          <AlertCircle className="w-10 h-10 text-rose-600 mb-3" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">Analysis Unavailable</h3>
          <p className="text-sm text-rose-800 max-w-md mb-6">{error || 'Repository details could not be loaded.'}</p>
          <button
            onClick={() => fetchHealth()}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 shadow-xs transition"
          >
            Retry Request
          </button>
        </div>
      </div>
    );
  }

  const { savedRepository, analysis } = data;
  const { metrics, findings, repository } = analysis;

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-rose-600';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Breadcrumb */}
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {repository.fullName}
              </h1>
              <a
                href={repository.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md transition font-medium"
              >
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              {repository.description || 'No description provided on GitHub.'}
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-500 mt-3">
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                {repository.stars?.toLocaleString()} stars
              </span>
              <span className="flex items-center gap-1">
                <GitFork className="w-3.5 h-3.5 text-blue-500" />
                {repository.forks?.toLocaleString()} forks
              </span>
              <span className="text-slate-300">•</span>
              <span>Default Branch: <code className="text-slate-700 font-semibold bg-slate-100 px-1 py-0.5 rounded">{repository.defaultBranch}</code></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSavePersistentReport}
              disabled={savingReport}
              className="inline-flex items-center gap-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{savingReport ? 'Saving Snapshot...' : 'Save Persistent Report'}</span>
            </button>
            <button
              onClick={() => fetchHealth(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2 rounded-lg transition disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Metrics'}</span>
            </button>
          </div>
        </div>

        {notification && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-xs">
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {notification}
            </span>
            <Link to="/reports" className="text-emerald-700 underline font-semibold hover:text-emerald-900">
              View All Reports &rarr;
            </Link>
          </div>
        )}
      </div>

      {/* Primary Health Score Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="flex items-start sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center shrink-0">
            <span className={`text-2xl font-black ${getScoreColor(metrics.healthScore)}`}>
              {metrics.healthScore}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">/ 100</span>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900">Repository Health Score</h2>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                metrics.healthScore >= 75
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : metrics.healthScore >= 50
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {metrics.healthStatus}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">
              Calculated deterministically from open pull request turnover velocity, issue activity staleness, and default branch commits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-8 text-xs text-slate-600">
          <div>
            <div className="text-slate-500 uppercase text-[10px] font-semibold">Analyzed At</div>
            <div className="text-slate-800 font-medium mt-0.5">
              {new Date(analysis.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <div>
            <div className="text-slate-500 uppercase text-[10px] font-semibold">Analysis Window</div>
            <div className="text-slate-800 font-medium mt-0.5">Past 30 Days</div>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-600" />
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

      {/* Deterministic Bottleneck Findings Section */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Identified Collaboration Bottlenecks ({findings.length})
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Deterministic findings flagged by stale issue inactivity (&gt; 30d), open PR age (&gt; 14d), and verified review deadlocks (&gt; 7d).
            </p>
          </div>
        </div>

        <FindingsSection findings={findings} />
      </div>
    </div>
  );
};
