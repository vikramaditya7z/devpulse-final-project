import React from 'react';

export const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'emerald' }) => {
  const colorStyles = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
  };

  const badgeClass = colorStyles[color] || colorStyles.emerald;

  return (
    <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-5 shadow-sm hover:border-slate-600 transition flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${badgeClass}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{value}</div>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

export const MetricCardSkeleton = () => {
  return (
    <div className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-5 shadow-sm animate-pulse flex flex-col justify-between h-32">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-20 bg-slate-700 rounded"></div>
        <div className="w-8 h-8 rounded-lg bg-slate-700"></div>
      </div>
      <div>
        <div className="h-7 w-16 bg-slate-700 rounded mb-2"></div>
        <div className="h-3 w-28 bg-slate-700/60 rounded"></div>
      </div>
    </div>
  );
};
