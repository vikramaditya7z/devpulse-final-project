import React from 'react';

export const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'emerald' }) => {
  const colorStyles = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    blue: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
    purple: 'text-violet-400 bg-violet-500/10 border-violet-500/25',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/25'
  };

  const badgeClass = colorStyles[color] || colorStyles.emerald;

  return (
    <div className="bg-[#101625]/90 border border-slate-800/80 rounded-xl p-5 shadow-md shadow-black/20 hover:border-slate-700/90 hover:bg-[#131b2e] transition flex flex-col justify-between group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${badgeClass} transition group-hover:scale-105`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">{value}</div>
        {subtitle && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{subtitle}</p>}
      </div>
    </div>
  );
};

export const MetricCardSkeleton = () => {
  return (
    <div className="bg-[#101625]/90 border border-slate-800/80 rounded-xl p-5 shadow-md animate-pulse flex flex-col justify-between h-32">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-20 bg-slate-800 rounded"></div>
        <div className="w-8 h-8 rounded-lg bg-slate-800"></div>
      </div>
      <div>
        <div className="h-7 w-16 bg-slate-800 rounded mb-2"></div>
        <div className="h-3 w-28 bg-slate-800/60 rounded"></div>
      </div>
    </div>
  );
};
