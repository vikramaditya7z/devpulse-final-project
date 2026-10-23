import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportApi } from '../services/api';
import {
  FileText,
  Clock,
  ArrowRight,
  Trash2,
  AlertCircle,
  FolderGit2
} from 'lucide-react';

export const PersonalReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportApi.getPersonalReports();
      setReports(data.reports || []);
    } catch (err) {
      setError(err.message || 'Failed to load personal reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDeleteReport = async () => {
    if (!reportToDelete) return;
    setDeleting(true);
    try {
      await reportApi.deletePersonalReport(reportToDelete._id);
      setReports((prev) => prev.filter((r) => r._id !== reportToDelete._id));
      setReportToDelete(null);
    } catch (err) {
      setError(err.message || 'Failed to delete report.');
      setReportToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-emerald-400" />
            Personal Health Reports
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Private, immutable historical snapshots of repository health and collaboration bottlenecks.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-lg transition"
        >
          <FolderGit2 className="w-4 h-4 text-emerald-400" />
          <span>Personal Dashboard</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-200 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Reports Table or Empty State */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-slate-800/40 border border-slate-800 rounded-xl p-6 h-40 animate-pulse">
                <div className="h-5 bg-slate-700 rounded w-1/2 mb-3"></div>
                <div className="h-3 bg-slate-700 rounded w-full mb-2"></div>
                <div className="h-3 bg-slate-700 rounded w-3/4 mb-4"></div>
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">No Personal Reports Generated Yet</h3>
            <p className="text-sm text-slate-400 max-w-md mt-1 mb-6">
              When analyzing any repository on your dashboard, click "Save Persistent Report" to create an immutable historical snapshot.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition"
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Go to Saved Repositories</span>
            </Link>
          </div>
        ) : (
          <div className="border border-slate-700/60 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-700/60">
                <tr>
                  <th className="py-3 px-4">Repository</th>
                  <th className="py-3 px-4">Health Score</th>
                  <th className="py-3 px-4">Pull Requests</th>
                  <th className="py-3 px-4">Bottlenecks</th>
                  <th className="py-3 px-4">Snapshot Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {reports.map((rep) => (
                  <tr key={rep._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {rep.repository?.fullName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-bold ${
                        rep.metrics?.healthScore >= 75
                          ? 'text-emerald-400'
                          : rep.metrics?.healthScore >= 50
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}>
                        {rep.metrics?.healthScore} / 100
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1.5">({rep.metrics?.healthStatus})</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {rep.metrics?.openPullRequestsCount} open / {rep.metrics?.mergedPullRequestsCount} merged
                    </td>
                    <td className="py-3.5 px-4 text-amber-400 font-medium">
                      {rep.findings?.length || 0} findings flagged
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(rep.generatedAt).toLocaleDateString()}{' '}
                      {new Date(rep.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/reports/${rep._id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-md transition"
                        >
                          <span>View</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                        <button
                          onClick={() => setReportToDelete(rep)}
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded transition"
                          title="Delete report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {reportToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Delete Report Snapshot?</h3>
            <p className="text-xs text-slate-300 mb-6">
              Are you sure you want to delete this historical report snapshot for <span className="font-semibold text-white">{reportToDelete.repository?.fullName}</span>?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setReportToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReport}
                disabled={deleting}
                className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg shadow disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
