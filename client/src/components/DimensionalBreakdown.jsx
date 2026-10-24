import React from 'react';
import { GitPullRequest, AlertCircle, GitCommit, MessageSquare, Gauge } from 'lucide-react';

export const DimensionalBreakdown = ({ dimensions }) => {
  if (!dimensions) return null;

  const dimensionConfigs = [
    {
      key: 'prVelocity',
      title: 'Pull Request Velocity',
      icon: GitPullRequest,
      weightLabel: '30% Weight',
      color: 'cyan',
      barColor: 'bg-cyan-500',
      textColor: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
    },
    {
      key: 'issueHygiene',
      title: 'Backlog Hygiene',
      icon: AlertCircle,
      weightLabel: '25% Weight',
      color: 'amber',
      barColor: 'bg-amber-500',
      textColor: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300'
    },
    {
      key: 'commitCadence',
      title: 'Commit Cadence',
      icon: GitCommit,
      weightLabel: '25% Weight',
      color: 'emerald',
      barColor: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
    },
    {
      key: 'reviewResponsiveness',
      title: 'Review Responsiveness',
      icon: MessageSquare,
      weightLabel: '20% Weight',
      color: 'violet',
      barColor: 'bg-violet-500',
      textColor: 'text-violet-400',
      badgeBg: 'bg-violet-500/10 border-violet-500/30 text-violet-300'
    }
  ];

  return (
    <div className="bg-[#101625] border border-slate-800/80 rounded-2xl p-6 shadow-lg shadow-black/40">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-emerald-400" />
            4-Dimensional Health Breakdown
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic bounded scoring model preventing single-dimension skew across high-backlog repositories.
          </p>
        </div>
        <span className="text-[11px] font-mono uppercase px-2.5 py-1 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60 self-start sm:self-auto">
          Sum: 100% Normalized
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dimensionConfigs.map((cfg) => {
          const dim = dimensions[cfg.key];
          if (!dim) return null;
          const Icon = cfg.icon;
          const score = typeof dim.score === 'number' ? Math.round(dim.score) : 0;
          const weighted = typeof dim.weightedScore === 'number' ? dim.weightedScore.toFixed(1) : '0';

          return (
            <div
              key={cfg.key}
              className="bg-[#0c101a] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700/80 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${cfg.badgeBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-slate-200">{cfg.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${cfg.badgeBg}`}>
                      {cfg.weightLabel}
                    </span>
                    <span className={`text-sm font-bold font-mono ${cfg.textColor}`}>
                      {score}<span className="text-[10px] text-slate-500 font-normal">/100</span>
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden my-3">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${cfg.barColor}`}
                    style={{ width: `${Math.max(3, Math.min(100, score))}%` }}
                  />
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  {dim.explanation || 'Evaluated against deterministic health criteria.'}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Weighted Contribution</span>
                <span className="font-semibold text-slate-300">+{weighted} pts</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
