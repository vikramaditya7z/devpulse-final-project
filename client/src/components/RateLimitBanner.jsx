import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';

export const RateLimitBanner = ({ error, onRetry }) => {
  if (!error) return null;

  const isRateLimit =
    error.code === 'GITHUB_RATE_LIMIT_EXCEEDED' ||
    error.code === 'RATE_LIMIT_EXCEEDED' ||
    error.status === 429 ||
    error.status === 403 ||
    (typeof error.message === 'string' && error.message.toLowerCase().includes('rate limit'));

  if (!isRateLimit) return null;

  const resetTimeStr = error.details?.resetAt
    ? new Date(error.details.resetAt).toLocaleTimeString()
    : null;

  return (
    <div className="bg-amber-950/40 border border-amber-800/80 text-amber-200 rounded-xl p-5 mb-6 shadow-md shadow-black/30">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-bold text-amber-300">GitHub API Rate Limit Notice</h4>
          <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
            GitHub restricts unauthenticated requests to 60 requests per hour. DevPulse relies purely on real GitHub REST API data, so new analysis queries are paused until your quota resets.
          </p>
          {resetTimeStr && (
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium mt-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Quota resets at: <strong>{resetTimeStr}</strong></span>
            </div>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 px-3.5 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-600/50 rounded-lg text-xs font-semibold transition"
            >
              Retry Analysis
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
