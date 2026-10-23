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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-emerald-600" />
            Personal Health Reports
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Private, immutable historical snapshots of repository health and collaboration bottlenecks.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-2 rounded-lg shadow-xs transition"
        >
          <FolderGit2 className="w-4 h-4 text-emerald-600" />
          <span>Personal Dashboard</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Reports Table or Empty State */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-slate-200 rounded-xl p-6 h-40 animate-pulse shadow-xs">
                <div className="h-5 bg-slate-200 rounded w-1/2 mb-3"></div>
                <div className="h-3 bg-slate-100 rounded w-full mb-2"></div>
                <div className="h-3 bg-slate-100 rounded w-3/4 mb-4"></div>
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">No Personal Reports Generated Yet</h3>
            <p className="text-sm text-slate-600 max-w-md mt-1 mb-6">
              When analyzing any repository on your dashboard, click "Save Persistent Report" to create an immutable historical snapshot.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition"
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Go to Saved Repositories</span>
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Repository</th>
                    <th className="py-3 px-4">Health Score</th>
                    <th className="py-3 px-4">Pull Requests</th>
                    <th className="py-3 px-4">Bottlenecks</th>
                    <th className="py-3 px-4">Snapshot Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((rep) => (
                    <tr key={rep._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {rep.repository?.fullName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-bold ${
                          rep.metrics?.healthScore >= 75
                            ? 'text-emerald-600'
                            : rep.metrics?.healthScore >= 50
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}>
                          {rep.metrics?.healthScore} / 100
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1.5">({rep.metrics?.healthStatus})</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {rep.metrics?.openPullRequestsCount} open / {rep.metrics?.mergedPullRequestsCount} merged
                      </td>
                      <td className="py-3.5 px-4 text-amber-700 font-semibold">
                        {rep.findings?.length || 0} findings flagged
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(rep.generatedAt).toLocaleDateString()}{' '}
                        {new Date(rep.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/reports/${rep._id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg shadow-xs transition"
                          >
                            <span>View</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                          <button
                            onClick={() => setReportToDelete(rep)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded transition"
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
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {reportToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Report Snapshot?</h3>
            <p className="text-xs text-slate-600 mb-6">
              Are you sure you want to delete this historical report snapshot for <span className="font-semibold text-slate-900">{reportToDelete.repository?.fullName}</span>?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setReportToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 bg-slate-50 border border-slate-300 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReport}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition disabled:opacity-50"
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
