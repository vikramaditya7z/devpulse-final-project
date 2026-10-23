import React from 'react';
import { AlertTriangle, Clock, ExternalLink, CheckCircle2, MessageSquareOff } from 'lucide-react';

export const FindingsSection = ({ findings = [] }) => {
  if (findings.length === 0) {
    return (
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-8 text-center flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-white">No Bottlenecks Detected</h4>
        <p className="text-sm text-slate-400 max-w-md mt-1">
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
        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
          Critical
        </span>
      );
    }
    if (severity === 'warning') {
      return (
        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Warning
        </span>
      );
    }
    return (
      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
        Info
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {findings.map((finding, idx) => (
        <div
          key={`${finding.type}-${finding.itemNumber}-${idx}`}
          className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-600 transition"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
              {getFindingIcon(finding.type)}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-semibold text-white text-sm">
                  #{finding.itemNumber}: {finding.title}
                </span>
                {getSeverityBadge(finding.severity)}
                <span className="text-xs text-slate-400 font-mono">
                  {finding.daysInactive} days inactive
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-2xl">
                {finding.explanation}
              </p>
            </div>
          </div>

          {finding.url && (
            <a
              href={finding.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-800/40 px-3 py-1.5 rounded-lg shrink-0 transition"
            >
              <span>View on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      ))}
    </div>
  );
};
