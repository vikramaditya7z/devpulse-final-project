import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { reportApi, repoApi, workspaceApi } from '../services/api';
import {
  GitCompare,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  ExternalLink,
  ShieldAlert,
  FolderGit2,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  GitPullRequest
} from 'lucide-react';

export const ReportCompare = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const baseParam = searchParams.get('base') || '';
  const targetParam = searchParams.get('target') || '';
  const repoParam = searchParams.get('repo') || '';
  const wsParam = searchParams.get('workspaceId') || '';

  const [availableRepos, setAvailableRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(repoParam);
  const [snapshots, setSnapshots] = useState([]);
  const [baseId, setBaseId] = useState(baseParam);
  const [targetId, setTargetId] = useState(targetParam);

  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);
  const [error, setError] = useState('');
  const [activeFindingTab, setActiveFindingTab] = useState('newlyDetected'); // 'newlyDetected' | 'noLongerDetected' | 'persisting'

  // Load user's saved repositories to populate the repository selector
  useEffect(() => {
    const fetchRepos = async () => {
      try {
        if (wsParam) {
          const wsReposData = await workspaceApi.getWorkspaceRepos(wsParam);
          setAvailableRepos(wsReposData.repositories || []);
        } else {
          const personalData = await repoApi.getSavedRepos();
          setAvailableRepos(personalData.repositories || []);
        }
      } catch (err) {
        console.warn('Could not load repositories for selector:', err.message);
      }
    };
    fetchRepos();
  }, [wsParam]);

  // When a repository is selected, fetch all historical snapshots for that repository
  useEffect(() => {
    if (!selectedRepo) return;

    const fetchSnapshots = async () => {
      try {
        setLoadingSnapshots(true);
        setError('');
        const data = await reportApi.getRepositorySnapshots(selectedRepo, wsParam || null);
        const list = data.snapshots || [];
        setSnapshots(list);

        // Auto-select latest 2 snapshots if not explicitly provided
        if (!baseId && !targetId && list.length >= 2) {
          setBaseId(list[1]._id); // earlier
          setTargetId(list[0]._id); // later
        }
      } catch (err) {
        setError(err.message || 'Failed to load snapshots for this repository.');
        setSnapshots([]);
      } finally {
        setLoadingSnapshots(false);
      }
    };

    fetchSnapshots();
  }, [selectedRepo, wsParam]);

  // When both baseId and targetId are ready, trigger comparison
  useEffect(() => {
    if (!baseId || !targetId) {
      setComparison(null);
      return;
    }

    if (baseId === targetId) {
      setError('Please select two distinct report snapshots to compare.');
      setComparison(null);
      return;
    }

    const runComparison = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await reportApi.compareReports(baseId, targetId);
        setComparison(data.comparison);
      } catch (err) {
        setError(err.message || 'Failed to generate report comparison.');
        setComparison(null);
      } finally {
        setLoading(false);
      }
    };

    runComparison();
  }, [baseId, targetId]);

  const handleRepoChange = (e) => {
    const nextRepo = e.target.value;
    setSelectedRepo(nextRepo);
    setBaseId('');
    setTargetId('');
    setComparison(null);
    setSearchParams(nextRepo ? { repo: nextRepo, ...(wsParam ? { workspaceId: wsParam } : {}) } : {});
  };

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
      {/* Header & Breadcrumb */}
      <div>
        <Link
          to={wsParam ? `/workspaces/${wsParam}` : '/reports'}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{wsParam ? 'Back to Workspace' : 'Back to Reports'}</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <GitCompare className="w-6 h-6" />
              </span>
              Historical Snapshot Comparison
            </h1>
            <p className="text-sm text-slate-400 mt-1.5">
              Compare two immutable health report snapshots for the same repository to measure health progress and resolve bottlenecks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-[#101625] border border-slate-800 text-slate-400">
              Deterministic V2 Diff Engine
            </span>
          </div>
        </div>
      </div>

      {/* Snapshot Selectors Panel */}
      <div className="bg-[#101625] border border-slate-800/80 rounded-2xl p-6 shadow-xl shadow-black/40 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Repository Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              1. Select Repository
            </label>
            <select
              value={selectedRepo}
              onChange={handleRepoChange}
              className="w-full px-3.5 py-2.5 bg-[#0d121f] border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
            >
              <option value="">-- Choose Repository --</option>
              {availableRepos.map((r) => (
                <option key={r._id || r.fullName} value={r.fullName}>
                  {r.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Earlier Snapshot Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              2. Earlier Baseline Snapshot
            </label>
            <select
              value={baseId}
              disabled={!selectedRepo || snapshots.length === 0}
              onChange={(e) => setBaseId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0d121f] border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 transition disabled:opacity-50"
            >
              <option value="">-- Choose Earlier Snapshot --</option>
              {snapshots.map((s) => (
                <option key={s._id} value={s._id}>
                  {new Date(s.generatedAt).toLocaleDateString()} {new Date(s.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — Score: {s.metrics?.healthScore}/100 ({s.metrics?.healthStatus})
                </option>
              ))}
            </select>
          </div>

          {/* Later Snapshot Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              3. Later Comparison Snapshot
            </label>
            <select
              value={targetId}
              disabled={!selectedRepo || snapshots.length === 0}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0d121f] border border-slate-700/80 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 transition disabled:opacity-50"
            >
              <option value="">-- Choose Later Snapshot --</option>
              {snapshots.map((s) => (
                <option key={s._id} value={s._id}>
                  {new Date(s.generatedAt).toLocaleDateString()} {new Date(s.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — Score: {s.metrics?.healthScore}/100 ({s.metrics?.healthStatus})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Snapshot Count & Helpers */}
        {selectedRepo && (
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
            <div>
              <span>Available historical snapshots for <strong className="text-slate-200 font-mono">{selectedRepo}</strong>: </span>
              <span className="font-bold text-cyan-400 font-mono">{snapshots.length}</span>
            </div>

            {snapshots.length === 1 && (
              <div className="text-amber-400 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>At least 2 snapshots are needed. Save another persistent report to compare progress.</span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-[#101625] border border-slate-800/80 rounded-2xl p-16 text-center flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <span className="text-slate-300 text-sm font-medium">Executing deterministic snapshot comparison...</span>
        </div>
      )}

      {/* Comparison Results */}
      {comparison && !loading && (
        <div className="space-y-8 animate-fadeIn">
          {/* Hero Score Transition Card */}
          <div className="bg-[#101625] border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100">
                    {comparison.repository.fullName}
                  </h2>
                  <a
                    href={comparison.repository.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800/80 border border-slate-700/80 px-2.5 py-1 rounded-lg transition"
                  >
                    <span>GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/60">
                    {comparison.snapshots.elapsedTimeFormatted || `${comparison.snapshots.elapsedDays} Days Elapsed`}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Comparing baseline recorded on {new Date(comparison.snapshots.earlier.generatedAt).toLocaleDateString()} against later report on {new Date(comparison.snapshots.later.generatedAt).toLocaleDateString()}.
                </p>
              </div>

              {/* Scoring model version notice */}
              <div className="text-right">
                <span className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border ${
                  comparison.healthScoreComparison.scoringModelsCompatible
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}>
                  Scoring Models: {comparison.snapshots.earlier.scoringModelVersion} → {comparison.snapshots.later.scoringModelVersion}
                </span>
                {comparison.healthScoreComparison.compatibilityNote && (
                  <p className="text-[10px] text-amber-400 max-w-xs mt-1 text-right">
                    {comparison.healthScoreComparison.compatibilityNote}
                  </p>
                )}
              </div>
            </div>

            {/* Score Comparison Visuals */}
            <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Earlier Snapshot */}
              <div className="p-5 rounded-xl bg-[#0c101a] border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">Earlier Snapshot</div>
                  <div className="text-xs text-slate-400 mb-1">
                    {new Date(comparison.snapshots.earlier.generatedAt).toLocaleDateString()} {new Date(comparison.snapshots.earlier.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getScoreBadge(comparison.healthScoreComparison.earlierScore)}`}>
                    {comparison.healthScoreComparison.earlierStatus}
                  </span>
                </div>
                <div className={`text-3xl font-black font-mono ${getScoreColor(comparison.healthScoreComparison.earlierScore)}`}>
                  {comparison.healthScoreComparison.earlierScore}
                  <span className="text-[10px] text-slate-500 font-normal">/100</span>
                </div>
              </div>

              {/* Delta Badge Center */}
              <div className="text-center flex flex-col items-center justify-center py-2">
                <div className="flex items-center gap-2 mb-1">
                  {comparison.healthScoreComparison.scoreDelta > 0 ? (
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  ) : comparison.healthScoreComparison.scoreDelta < 0 ? (
                    <TrendingDown className="w-5 h-5 text-rose-400" />
                  ) : (
                    <Minus className="w-5 h-5 text-slate-400" />
                  )}

                  <span className={`text-2xl font-black font-mono ${
                    comparison.healthScoreComparison.scoreDelta > 0
                      ? 'text-emerald-400'
                      : comparison.healthScoreComparison.scoreDelta < 0
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}>
                    {comparison.healthScoreComparison.scoreDelta > 0 ? `+${comparison.healthScoreComparison.scoreDelta}` : comparison.healthScoreComparison.scoreDelta} pts
                  </span>
                </div>
                <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
                  Net Health Movement
                </span>
              </div>

              {/* Later Snapshot */}
              <div className="p-5 rounded-xl bg-[#0c101a] border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-500 font-bold mb-1">Later Snapshot</div>
                  <div className="text-xs text-slate-400 mb-1">
                    {new Date(comparison.snapshots.later.generatedAt).toLocaleDateString()} {new Date(comparison.snapshots.later.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getScoreBadge(comparison.healthScoreComparison.laterScore)}`}>
                    {comparison.healthScoreComparison.laterStatus}
                  </span>
                </div>
                <div className={`text-3xl font-black font-mono ${getScoreColor(comparison.healthScoreComparison.laterScore)}`}>
                  {comparison.healthScoreComparison.laterScore}
                  <span className="text-[10px] text-slate-500 font-normal">/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Deterministic Evidence-Based Change Summary */}
          {comparison.summaryStatements && comparison.summaryStatements.length > 0 && (
            <div className="bg-[#101625] border border-cyan-500/30 rounded-2xl p-6 shadow-xl shadow-black/40">
              <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Evidence-Based Change Summary
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                {comparison.summaryStatements.map((statement, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="text-cyan-400 font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">{statement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 4-Dimensional Comparisons */}
          <div className="bg-[#101625] border border-slate-800/80 rounded-2xl p-6 shadow-xl shadow-black/40">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-1">
              <Layers className="w-5 h-5 text-emerald-400" />
              Dimensional Health Differences
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Track how individual dimensions moved over the {comparison.snapshots.elapsedDays}-day observation interval.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['prVelocity', 'issueHygiene', 'commitCadence', 'reviewResponsiveness'].map((dimKey) => {
                const dim = comparison.dimensionsComparison[dimKey];
                if (!dim) return null;

                if (!dim.comparable) {
                  return (
                    <div key={dimKey} className="p-4 rounded-xl bg-[#0c101a] border border-slate-800 text-xs text-slate-500">
                      <div className="font-semibold text-slate-300 mb-1">{dim.label}</div>
                      <p>{dim.explanation}</p>
                    </div>
                  );
                }

                return (
                  <div key={dimKey} className="p-4 rounded-xl bg-[#0c101a] border border-slate-800 hover:border-slate-700 transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-200">{dim.label}</span>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="text-slate-400">{dim.earlierScore}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="text-slate-100 font-bold">{dim.laterScore}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          dim.delta > 0
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                            : dim.delta < 0
                            ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {dim.delta > 0 ? `+${dim.delta}` : dim.delta}
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden my-3">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          dim.delta > 0 ? 'bg-emerald-500' : dim.delta < 0 ? 'bg-rose-500' : 'bg-cyan-500'
                        }`}
                        style={{ width: `${Math.max(3, Math.min(100, dim.laterScore))}%` }}
                      />
                    </div>

                    <p className="text-xs text-slate-400">{dim.interpretation}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Metrics Comparison Grid */}
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-4">
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              Repository Metrics Transitions
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.keys(comparison.metricsComparison).map((mKey) => {
                const metric = comparison.metricsComparison[mKey];
                return (
                  <div key={mKey} className="p-4 rounded-xl bg-[#101625] border border-slate-800/80 shadow-lg">
                    <div className="text-[11px] uppercase font-mono font-semibold text-slate-400 mb-2 truncate">
                      {metric.label}
                    </div>

                    <div className="flex items-baseline justify-between mb-2">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-sm text-slate-400">{metric.earlierValue}</span>
                        <ArrowRight className="w-3 h-3 text-slate-600" />
                        <span className="text-lg font-bold text-slate-100">{metric.laterValue}</span>
                      </div>

                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        metric.isImprovement
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                          : metric.isRegression
                          ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {metric.delta > 0 ? `+${metric.delta}` : metric.delta} {metric.percentChange !== null && `(${metric.percentFormatted})`}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono">
                      Unit: {metric.unit}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottlenecks Transition Explorer */}
          <div className="bg-[#101625] border border-slate-800/80 rounded-2xl p-6 shadow-xl shadow-black/40">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Collaboration Bottlenecks Transition ({comparison.findingsComparison.laterTotalCount ?? (comparison.findingsComparison.newlyDetectedCount + comparison.findingsComparison.persistingCount)} Snapshot Findings)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Classified by stable finding IDs to distinguish new issues, resolved bottlenecks, and persisting items.
                  {comparison.findingsComparison.laterCriticalCount !== undefined && (
                    <span className="block mt-0.5 text-slate-500 font-mono text-[11px]">
                      Later snapshot composition: {comparison.findingsComparison.laterCriticalCount} critical · {comparison.findingsComparison.laterWarningCount} warning findings.
                    </span>
                  )}
                </p>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-2 p-1 rounded-xl bg-[#0c101a] border border-slate-800">
                <button
                  onClick={() => setActiveFindingTab('newlyDetected')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeFindingTab === 'newlyDetected'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Newly Detected ({comparison.findingsComparison.newlyDetectedCount})
                </button>

                <button
                  onClick={() => setActiveFindingTab('noLongerDetected')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeFindingTab === 'noLongerDetected'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Resolved ({comparison.findingsComparison.noLongerDetectedCount})
                </button>

                <button
                  onClick={() => setActiveFindingTab('persisting')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeFindingTab === 'persisting'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Persisting ({comparison.findingsComparison.persistingCount})
                </button>
              </div>
            </div>

            {/* Tab 1: Newly Detected */}
            {activeFindingTab === 'newlyDetected' && (
              <div>
                {comparison.findingsComparison.newlyDetectedCount === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    No new bottlenecks emerged between these two snapshots.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {comparison.findingsComparison.newlyDetected.map((f, i) => (
                      <div
                        key={f.id || i}
                        className="p-4 rounded-xl bg-[#0c101a] border border-amber-500/30 hover:border-amber-500/50 transition flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              NEW · {f.severity}
                            </span>
                            <span className="font-bold text-slate-200 text-sm">
                              {f.itemNumber ? `#${f.itemNumber}: ` : ''}{f.title || f.explanation || 'Identified Bottleneck'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mb-2">{f.explanation}</p>
                          {f.ruleBasedAction && (
                            <span className="inline-block text-[11px] font-mono bg-slate-800/80 text-amber-300 px-2.5 py-1 rounded border border-slate-700/60">
                              Action: {f.ruleBasedAction}
                            </span>
                          )}
                        </div>

                        {f.url && (
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 shrink-0 font-medium"
                          >
                            <span>Inspect GitHub</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Resolved / No Longer Detected */}
            {activeFindingTab === 'noLongerDetected' && (
              <div>
                {comparison.findingsComparison.noLongerDetectedCount === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No bottlenecks were closed or resolved since the earlier snapshot.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {comparison.findingsComparison.noLongerDetected.map((f, i) => (
                      <div
                        key={f.id || i}
                        className="p-4 rounded-xl bg-[#0c101a] border border-emerald-500/30 hover:border-emerald-500/50 transition flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                              RESOLVED
                            </span>
                            <span className="font-bold text-slate-200 text-sm">
                              {f.itemNumber ? `#${f.itemNumber}: ` : ''}{f.title || f.explanation || 'Identified Bottleneck'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            Previously flagged as {f.severity}. This bottleneck is no longer active in the later snapshot.
                          </p>
                        </div>

                        {f.url && (
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 shrink-0 font-medium"
                          >
                            <span>Inspect GitHub</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Persisting */}
            {activeFindingTab === 'persisting' && (
              <div>
                {comparison.findingsComparison.persistingCount === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No persisting bottlenecks detected across both snapshots.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {comparison.findingsComparison.persisting.map((f, i) => (
                      <div
                        key={f.id || i}
                        className={`p-4 rounded-xl bg-[#0c101a] border transition flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                          f.severityUpgraded
                            ? 'border-rose-500/40 hover:border-rose-500'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded ${
                              f.currentSeverity === 'critical'
                                ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700/60'
                            }`}>
                              PERSISTING · {f.currentSeverity}
                            </span>

                            {f.severityUpgraded && (
                              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                Upgraded from {f.earlierSeverity}
                              </span>
                            )}

                            <span className="font-bold text-slate-200 text-sm">
                              {f.itemNumber ? `#${f.itemNumber}: ` : ''}{f.title || f.explanation || 'Identified Bottleneck'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 mb-2">
                            {f.explanation} (
                            {f.daysInactiveDelta > 0
                              ? `Inactive duration grew by +${f.daysInactiveDelta} days`
                              : f.daysInactiveDelta < 0
                              ? `Inactive duration decreased by ${Math.abs(f.daysInactiveDelta)} days`
                              : `Inactive duration unchanged at ${f.daysInactive || 0} days`}
                            ).
                          </p>

                          {f.ruleBasedAction && (
                            <span className="inline-block text-[11px] font-mono bg-slate-800/80 text-cyan-300 px-2.5 py-1 rounded border border-slate-700/60">
                              Action: {f.ruleBasedAction}
                            </span>
                          )}
                        </div>

                        {f.url && (
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 shrink-0 font-medium"
                          >
                            <span>Inspect GitHub</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
