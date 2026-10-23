import React from 'react';

export const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'emerald' }) => {
  const colorStyles = {
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    blue: 'text-blue-700 bg-blue-50 border-blue-200',
    amber: 'text-amber-700 bg-amber-50 border-amber-200',
    purple: 'text-purple-700 bg-purple-50 border-purple-200',
    rose: 'text-rose-700 bg-rose-50 border-rose-200'
  };

  const badgeClass = colorStyles[color] || colorStyles.emerald;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${badgeClass}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{value}</div>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

export const MetricCardSkeleton = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs animate-pulse flex flex-col justify-between h-32">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-20 bg-slate-200 rounded"></div>
        <div className="w-8 h-8 rounded-lg bg-slate-200"></div>
      </div>
      <div>
        <div className="h-7 w-16 bg-slate-200 rounded mb-2"></div>
        <div className="h-3 w-28 bg-slate-100 rounded"></div>
      </div>
    </div>
  );
};
