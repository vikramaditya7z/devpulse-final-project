import React from 'react';
import { AlertTriangle, Clock, ExternalLink, CheckCircle2, MessageSquareOff } from 'lucide-react';

export const FindingsSection = ({ findings = [] }) => {
  if (findings.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center flex flex-col items-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-slate-900">No Bottlenecks Detected</h4>
        <p className="text-sm text-slate-600 max-w-md mt-1">
          Pull request velocity and issue hygiene are in good standing. No stale issues, overdue pull requests, or review deadlocks were found.
        </p>
      </div>
    );
  }

  const getFindingIcon = (type) => {
    switch (type) {
      case 'stale_issue':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'old_open_pr':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'review_inactivity':
        return <MessageSquareOff className="w-4 h-4 text-amber-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    }
  };

  const getSeverityBadge = (severity) => {
    if (severity === 'critical') {
      return (
        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
          Critical
        </span>
      );
    }
    if (severity === 'warning') {
      return (
        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
          Warning
        </span>
      );
    }
    return (
      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
        Info
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {findings.map((finding, idx) => (
        <div
          key={`${finding.type}-${finding.itemNumber}-${idx}`}
          className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 hover:shadow-xs transition"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
              {getFindingIcon(finding.type)}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-semibold text-slate-900 text-sm">
                  #{finding.itemNumber}: {finding.title}
                </span>
                {getSeverityBadge(finding.severity)}
                <span className="text-xs text-slate-500 font-mono">
                  {finding.daysInactive} days inactive
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed max-w-2xl">
                {finding.explanation}
              </p>
            </div>
          </div>

          {finding.url && (
            <a
              href={finding.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg shrink-0 transition"
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
