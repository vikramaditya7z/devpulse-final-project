import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mb-4 shadow-xs">
        <AlertCircle className="w-8 h-8 text-amber-600" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">404 — Page Not Found</h1>
      <p className="text-sm text-slate-600 max-w-sm mb-6">
        The page or resource you requested could not be located on DevPulse.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Dashboard
      </Link>
    </div>
  );
};
