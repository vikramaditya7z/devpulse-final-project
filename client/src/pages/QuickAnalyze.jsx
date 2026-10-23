import React, { useState } from 'react';
import { repoApi } from '../services/api';
import { MetricCard } from '../components/MetricCard';
import { FindingsSection } from '../components/FindingsSection';
import { RateLimitBanner } from '../components/RateLimitBanner';
import {
  Search,
  Activity,
  AlertCircle,
  CheckCircle2,
  GitPullRequest,
  Clock,
  GitCommit,
  Plus,
  ExternalLink,
  Star,
  GitFork,
  AlertTriangle
} from 'lucide-react';

export const QuickAnalyze = () => {
  const [repoInput, setRepoInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [errorObj, setErrorObj] = useState(null);
  const [saveStatus, setSaveStatus] = useState({ saving: false, saved: false, message: '' });

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!repoInput.trim()) {
      setError('Please enter a valid repository identifier (e.g. facebook/react).');
      return;
    }

    setLoading(true);
    setError('');
    setErrorObj(null);
    setAnalysis(null);
    setSaveStatus({ saving: false, saved: false, message: '' });

    try {
      const result = await repoApi.analyzeDirect({ repoIdentifier: repoInput.trim() });
      setAnalysis(result.analysis);
    } catch (err) {
      setError(err.message || 'Failed to analyze repository. Verify owner and repo name.');
      setErrorObj(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDashboard = async () => {
    if (!analysis) return;
    setSaveStatus({ saving: true, saved: false, message: '' });

    try {
      await repoApi.saveRepo({ repoIdentifier: analysis.repository.fullName });
      setSaveStatus({ saving: false, saved: true, message: 'Saved to dashboard!' });
    } catch (err) {
      setSaveStatus({ saving: false, saved: false, message: err.message || 'Failed to save.' });
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-rose-600';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Search className="w-6 h-6 text-emerald-600" />
          On-Demand Repository Health Analysis
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Perform immediate health analysis on any public GitHub repository without needing to save it first.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="e.g. facebook/react or expressjs/express"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm px-6 py-2.5 rounded-lg shadow-sm transition disabled:opacity-50 shrink-0"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Querying GitHub...</span>
              </>
            ) : (
              <>
                <Activity className="w-4 h-4" />
                <span>Run Analysis</span>
              </>
            )}
          </button>
        </form>

        {errorObj && <RateLimitBanner error={errorObj} onRetry={handleAnalyze} />}

        {error && !errorObj?.details?.resetAt && (
          <div className="mt-4 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Analysis Results Display */}
      {analysis && (
        <div className="space-y-8 animate-fadeIn">
          {/* Summary Banner */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {analysis.repository.fullName}
                </h2>
                <a
                  href={analysis.repository.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md transition font-medium"
                >
                  <span>GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-xl">
                {analysis.repository.description || 'Public GitHub Repository'}
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  {analysis.repository.stars?.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <GitFork className="w-3.5 h-3.5 text-blue-500" />
                  {analysis.repository.forks?.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center px-4 py-2 rounded-xl bg-slate-50 border border-slate-200">
                <div className={`text-2xl font-bold ${getScoreColor(analysis.metrics.healthScore)}`}>
                  {analysis.metrics.healthScore}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-500">
                  {analysis.metrics.healthStatus}
                </div>
              </div>

              <button
                onClick={handleSaveToDashboard}
                disabled={saveStatus.saving || saveStatus.saved}
                className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-500 text-white px-4 py-2.5 rounded-lg shadow-sm transition"
              >
                {saveStatus.saved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-100" />
                    <span>Saved to Dashboard</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Save to Dashboard</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {saveStatus.message && !saveStatus.saved && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              {saveStatus.message}
            </div>
          )}

          {/* Vitals Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              title="Open Issues"
              value={analysis.metrics.openIssuesCount}
              subtitle="Excluding pull requests"
              icon={AlertCircle}
              color="amber"
            />
            <MetricCard
              title="Open PRs"
              value={analysis.metrics.openPullRequestsCount}
              subtitle="Pending integration"
              icon={GitPullRequest}
              color="blue"
            />
            <MetricCard
              title="Merged PRs"
              value={analysis.metrics.mergedPullRequestsCount}
              subtitle="Past 30 days"
              icon={CheckCircle2}
              color="emerald"
            />
            <MetricCard
              title="Avg Merge Time"
              value={`${analysis.metrics.averagePRMergeTimeHours}h`}
              subtitle="Turnaround velocity"
              icon={Clock}
              color="purple"
            />
            <MetricCard
              title="Recent Commits"
              value={analysis.metrics.recentCommitsCount}
              subtitle="Default branch activity"
              icon={GitCommit}
              color="rose"
            />
          </div>

          {/* Bottlenecks */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Identified Collaboration Bottlenecks ({analysis.findings.length})
            </h3>
            <FindingsSection findings={analysis.findings} />
          </div>
        </div>
      )}
    </div>
  );
};
