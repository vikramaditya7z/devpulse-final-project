import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  ExternalLink,
  CheckCircle2,
  MessageSquareOff,
  Filter,
  Search,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';

export const FindingsSection = ({ findings = [] }) => {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'critical' | 'warning' | 'stale_issue' | 'old_open_pr' | 'review_inactivity'
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      // Severity / Category match
      if (filterType === 'critical' && f.severity !== 'critical') return false;
      if (filterType === 'warning' && f.severity !== 'warning') return false;
      if (['stale_issue', 'old_open_pr', 'review_inactivity'].includes(filterType) && f.type !== filterType) {
        return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const numMatch = f.itemNumber?.toString().includes(query);
        const titleMatch = f.title?.toLowerCase().includes(query);
        const explMatch = f.explanation?.toLowerCase().includes(query);
        return numMatch || titleMatch || explMatch;
      }

      return true;
    });
  }, [findings, filterType, searchQuery]);

  const displayedFindings = showAll ? filteredFindings : filteredFindings.slice(0, 10);

  if (findings.length === 0) {
    return (
      <div className="bg-[#101625]/90 border border-slate-800/80 rounded-xl p-8 text-center flex flex-col items-center shadow-lg">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-white">No Bottlenecks Detected</h4>
        <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
          Pull request velocity and issue hygiene are in good standing. No stale issues, overdue pull requests, or review deadlocks were found.
        </p>
      </div>
    );
  }

  const getFindingIcon = (type) => {
    switch (type) {
      case 'stale_issue':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'old_open_pr':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'review_inactivity':
        return <MessageSquareOff className="w-4 h-4 text-amber-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
  };

  const getSeverityBadge = (severity) => {
    if (severity === 'critical') {
      return (
        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
          Critical
        </span>
      );
    }
    return (
      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
        Warning
      </span>
    );
  };

  const counts = {
    all: findings.length,
    critical: findings.filter((f) => f.severity === 'critical').length,
    warning: findings.filter((f) => f.severity === 'warning').length,
    stale_issue: findings.filter((f) => f.type === 'stale_issue').length,
    old_open_pr: findings.filter((f) => f.type === 'old_open_pr').length,
    review_inactivity: findings.filter((f) => f.type === 'review_inactivity').length
  };

  return (
    <div className="space-y-4">
      {/* Filtering Toolbar */}
      <div className="bg-[#101625]/90 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-md">
        {/* Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterType('all')}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
              filterType === 'all'
                ? 'bg-slate-700 text-white border border-slate-600'
                : 'text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800'
            }`}
          >
            All ({counts.all})
          </button>

          {counts.critical > 0 && (
            <button
              onClick={() => setFilterType('critical')}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                filterType === 'critical'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40'
              }`}
            >
              Critical ({counts.critical})
            </button>
          )}

          {counts.warning > 0 && (
            <button
              onClick={() => setFilterType('warning')}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                filterType === 'warning'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-amber-400 hover:text-amber-300 bg-amber-950/20 hover:bg-amber-950/40'
              }`}
            >
              Warnings ({counts.warning})
            </button>
          )}

          {counts.stale_issue > 0 && (
            <button
              onClick={() => setFilterType('stale_issue')}
              className={`hidden md:inline-flex text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
                filterType === 'stale_issue'
                  ? 'bg-slate-700 text-white border border-slate-600'
                  : 'text-slate-400 hover:text-white bg-slate-800/50'
              }`}
            >
              Stale Issues ({counts.stale_issue})
            </button>
          )}

          {counts.old_open_pr > 0 && (
            <button
              onClick={() => setFilterType('old_open_pr')}
              className={`hidden md:inline-flex text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
                filterType === 'old_open_pr'
                  ? 'bg-slate-700 text-white border border-slate-600'
                  : 'text-slate-400 hover:text-white bg-slate-800/50'
              }`}
            >
              Open PRs ({counts.old_open_pr})
            </button>
          )}

          {counts.review_inactivity > 0 && (
            <button
              onClick={() => setFilterType('review_inactivity')}
              className={`hidden md:inline-flex text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
                filterType === 'review_inactivity'
                  ? 'bg-slate-700 text-white border border-slate-600'
                  : 'text-slate-400 hover:text-white bg-slate-800/50'
              }`}
            >
              Review Inactivity ({counts.review_inactivity})
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by # or title..."
            className="w-full pl-8 pr-3 py-1 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Showing count indicator */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <strong>{displayedFindings.length}</strong> of <strong>{filteredFindings.length}</strong> bottleneck findings
        </span>
        {filteredFindings.length > 10 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition"
          >
            <span>{showAll ? 'Collapse to top 10' : `Show all ${filteredFindings.length}`}</span>
            {showAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Findings List */}
      <div className="space-y-2.5">
        {displayedFindings.map((finding) => (
          <div
            key={finding.id || `${finding.type}-${finding.itemNumber}`}
            className="bg-[#101625]/85 border border-slate-800/80 rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-3.5 hover:border-slate-700 hover:bg-[#131b2e] transition"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                {getFindingIcon(finding.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-semibold text-white text-sm truncate">
                    {finding.itemNumber ? `#${finding.itemNumber}: ` : ''}{finding.title || finding.explanation || 'Identified Bottleneck'}
                  </span>
                  {getSeverityBadge(finding.severity)}
                  <span className="text-xs text-slate-400 font-mono">
                    {finding.daysInactive}d inactive
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {finding.explanation}
                </p>

                {/* Rule-based next action */}
                {finding.ruleBasedAction && (
                  <div className="mt-2 text-xs bg-slate-900/90 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                      Recommended Action
                    </span>
                    <span className="text-slate-300">{finding.ruleBasedAction}</span>
                  </div>
                )}
              </div>

              {finding.url && (
                <a
                  href={finding.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-800/40 px-3 py-1.5 rounded-lg shrink-0 transition"
                >
                  <span>GitHub</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Show more bottom footer button */}
      {filteredFindings.length > 10 && (
        <div className="text-center pt-2">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            {showAll ? 'Show less (first 10)' : `View all remaining ${filteredFindings.length - 10} findings`}
          </button>
        </div>
      )}
    </div>
  );
};
