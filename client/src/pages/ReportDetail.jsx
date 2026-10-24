import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { reportApi } from '../services/api';
import { MetricCard } from '../components/MetricCard';
import { FindingsSection } from '../components/FindingsSection';
import { DimensionalBreakdown } from '../components/DimensionalBreakdown';
import {
  ArrowLeft,
  FileText,
  Clock,
  Shield,
  User,
  AlertCircle,
  ExternalLink,
  Star,
  GitPullRequest,
  CheckCircle2,
  GitCommit,
  AlertTriangle
} from 'lucide-react';

export const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await reportApi.getReportById(id);
        setReport(data.report);
      } catch (err) {
        setError(err.message || 'Failed to load report snapshot.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <span className="text-slate-400 text-sm font-medium">Loading persistent report snapshot...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className="bg-[#101625] border border-rose-500/30 rounded-2xl p-8 flex flex-col items-center shadow-xl">
          <AlertCircle className="w-10 h-10 text-rose-400 mb-3" />
          <h2 className="text-lg font-bold text-slate-100 mb-1">Report Unavailable</h2>
          <p className="text-sm text-rose-300 max-w-md mb-6">{error || 'This report does not exist or you do not have permission to view it.'}</p>
          <Link
            to="/reports"
            className="px-4 py-2 bg-[#0d121f] hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/80 transition"
          >
            Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  const { repository, metrics, findings, scope, workspace, createdBy, generatedAt, reportingPeriodDays } = report;

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBadge = (score) => {
    if (score >= 75) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
    if (score >= 50) return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
    return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Top Breadcrumb & Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
                <FileText className="w-7 h-7 text-emerald-400" />
                Health Report Snapshot
              </h1>

              {scope === 'workspace' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  <Shield className="w-3.5 h-3.5" />
                  Workspace: {workspace?.name || 'Team Workspace'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  <User className="w-3.5 h-3.5" />
                  Personal Report
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 mt-2 flex-wrap font-mono">
              <span className="font-bold text-slate-200">{repository.fullName}</span>
              <a
                href={repository.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>View on GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-600">•</span>
              <span>Generated by {createdBy?.name || 'User'}</span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {new Date(generatedAt).toLocaleDateString()}{' '}
                {new Date(generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Immutable Snapshot Notice Banner */}
      <div className="p-4 rounded-xl bg-[#0c101a] border border-slate-800 text-xs text-slate-300 flex items-center justify-between gap-4 shadow-md font-mono">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            This is an <strong className="text-emerald-300">immutable historical snapshot</strong> preserving the health metrics and bottleneck findings recorded on {new Date(generatedAt).toLocaleDateString()}.
          </span>
        </div>
        <span className="font-semibold text-slate-400 shrink-0">Period: {reportingPeriodDays} Days</span>
      </div>

      {/* Health Score Banner */}
      <div className="bg-[#101625] border border-slate-800/80 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-black/50">
        <div className="flex items-start sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-[#0c101a] border border-slate-800 flex flex-col items-center justify-center shrink-0">
            <span className={`text-3xl font-black font-mono ${getScoreColor(metrics.healthScore)}`}>
              {metrics.healthScore}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">/ 100</span>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-100">Snapshot Health Score</h2>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getScoreBadge(metrics.healthScore)}`}>
                {metrics.healthStatus}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Historical record of pull request turnaround velocity, issue backlog, and commit activity.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-8 text-xs text-slate-400 font-mono">
          <div>
            <div className="text-slate-500 uppercase text-[10px] font-semibold">Findings Flagged</div>
            <div className="text-slate-200 font-bold text-base mt-0.5">{findings?.length || 0}</div>
          </div>
          <div>
            <div className="text-slate-500 uppercase text-[10px] font-semibold">Critical Bottlenecks</div>
            <div className="text-rose-400 font-bold text-base mt-0.5">{metrics.criticalFindingsCount || 0}</div>
          </div>
        </div>
      </div>

      {/* 4-Dimensional Breakdown */}
      {metrics?.dimensions && (
        <DimensionalBreakdown dimensions={metrics.dimensions} />
      )}

      {/* Vitals Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Recorded Vitals
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Open Issues"
            value={metrics.openIssuesCount}
            subtitle="At time of snapshot"
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
            subtitle="Within 30d window"
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

      {/* Bottlenecks Snapshot */}
      <div>
        <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          Recorded Bottlenecks Snapshot ({findings?.length || 0})
        </h3>
        <FindingsSection findings={findings} />
      </div>
    </div>
  );
};
