import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { inviteApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Shield,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  LogIn,
  UserPlus
} from 'lucide-react';

export const InviteAccept = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);

  useEffect(() => {
    // Preserve pending invitation token in session storage for unauthenticated visitors
    if (token) {
      sessionStorage.setItem('pendingInviteToken', token);
    }

    const validateToken = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await inviteApi.validateToken(token);
        setPreview(data);
      } catch (err) {
        setError(err.message || 'Invitation link is invalid or expired.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      validateToken();
    }
  }, [token]);

  const handleJoinWorkspace = async () => {
    setJoining(true);
    setError(null);

    try {
      const data = await inviteApi.acceptInvitation(token);
      // Clean up stored pending token
      sessionStorage.removeItem('pendingInviteToken');
      navigate(`/workspaces/${data.workspaceId}`);
    } catch (err) {
      if (err.code === 'ALREADY_MEMBER') {
        setAlreadyMember(true);
      } else {
        setError(err.message || 'Failed to accept invitation.');
      }
    } finally {
      setJoining(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-slate-600 text-sm">Validating invitation link...</p>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-8 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Invitation Unavailable</h2>
          <p className="text-sm text-slate-600 mb-6">{error || 'This invitation link cannot be used.'}</p>
          <Link
            to={isAuthenticated ? '/workspaces' : '/login'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg shadow-sm transition"
          >
            <span>{isAuthenticated ? 'Go to Workspaces' : 'Sign in to DevPulse'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-8 shadow-md text-center space-y-6">
        {/* Workspace Icon */}
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
          <Users className="w-7 h-7" />
        </div>

        {/* Invitation Greeting */}
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
            Team Workspace Invitation
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
            {preview.workspace.name}
          </h1>
          <p className="text-xs text-slate-600 mt-2 max-w-sm mx-auto">
            {preview.workspace.description || 'You have been invited to collaborate on this DevPulse workspace.'}
          </p>
        </div>

        {/* Inviter & Expiration Metadata */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-around text-xs text-slate-700">
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-500">Invited By</div>
            <div className="font-semibold text-slate-900 mt-0.5">{preview.invitedBy.name}</div>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <div className="text-[10px] uppercase font-semibold text-slate-500 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              Expires
            </div>
            <div className="text-slate-700 font-medium mt-0.5">
              {new Date(preview.expiresAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Already a member notice */}
        {alreadyMember && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs">
            You are already an active member of this workspace.
          </div>
        )}

        {/* Action Buttons */}
        <div>
          {isAuthenticated ? (
            alreadyMember ? (
              <button
                onClick={() => navigate(`/workspaces/${preview.workspace._id}`)}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-5 rounded-xl shadow-sm transition"
              >
                <span>Go to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleJoinWorkspace}
                disabled={joining}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-5 rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {joining ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Joining Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Accept &amp; Join Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                You must be logged into DevPulse to accept this invitation.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/login"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-4 rounded-xl shadow-sm transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Join</span>
                </Link>
                <Link
                  to="/register"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 py-2.5 px-4 rounded-xl shadow-sm transition"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
