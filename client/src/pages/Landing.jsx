import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  ArrowRight,
  GitPullRequest,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderGit2,
  Shield,
  FileText,
  Users,
  Search,
  GitCommit,
  AlertCircle,
  ExternalLink,
  Star,
  GitFork,
  Sparkles,
  Zap,
  BarChart3
} from 'lucide-react';

export const Landing = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 border-b border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-6 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              DevPulse v1.0 · GitHub Health & Engineering Analytics
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Understand the health of your{' '}
              <span className="text-emerald-600">GitHub projects</span>.
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              DevPulse analyzes live GitHub pull requests, issues, and commit activity to calculate deterministic health scores, identify collaboration bottlenecks, and power team workspaces.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-sm hover:shadow transition"
                >
                  <span>Go to Personal Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-6 py-3 rounded-lg shadow-sm hover:shadow transition"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-sm px-6 py-3 rounded-lg border border-slate-300 shadow-sm transition"
                  >
                    <span>Sign In</span>
                  </Link>
                </>
              )}
              <a
                href="#demo-preview"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm px-5 py-3 rounded-lg hover:bg-slate-200/50 transition"
              >
                <span>View Live Sample Data</span>
                <BarChart3 className="w-4 h-4 text-emerald-600" />
              </a>
            </div>

            {/* Trust Points */}
            <div className="mt-10 pt-8 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-y-2 gap-x-8 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                100% Deterministic Scoring
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Zero Fake or Simulated Metrics
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Secure Single-Use Invite Tokens
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Realistic UI Preview Section */}
      <section id="demo-preview" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md mb-2">
            <Zap className="w-3.5 h-3.5" />
            Interactive Analytics Preview
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Real Repository Intelligence at a Glance
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Every health score is computed deterministically from active GitHub pull request turnaround, issue inactivity, and commit velocity.
          </p>
        </div>

        {/* Mock Application Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Mock Window Top Bar */}
          <div className="bg-slate-100/80 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="ml-2 text-xs font-mono font-medium text-slate-500">
                devpulse.app/repo/acme-org/backend-service
              </span>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
              <span>Sample Demonstration Data</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Repo Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                    acme-org/backend-service
                  </h3>
                  <span className="text-xs bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-mono">
                    main
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  High-throughput payment orchestration and microservice event hub.
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    4,820 stars
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="w-3.5 h-3.5 text-blue-500" />
                    942 forks
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Analysis window: Past 30 days</span>
              </div>
            </div>

            {/* Score Banner */}
            <div className="bg-gradient-to-r from-emerald-50/70 via-white to-slate-50 border border-emerald-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white border border-emerald-300 shadow-sm flex flex-col items-center justify-center shrink-0">
                  <span className="text-2xl font-black text-emerald-600">88</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">/ 100</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900">Healthy Repository Status</h4>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Healthy
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-lg">
                    Strong pull request turnaround velocity and active continuous integration. 2 minor bottlenecks detected.
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-500 border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-6">
                <div>Health Calculation:</div>
                <div className="font-semibold text-slate-700 mt-0.5">Weighted PR & Issue Turnover</div>
              </div>
            </div>

            {/* Vitals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase text-slate-500 mb-1">Open Issues</div>
                <div className="text-2xl font-bold text-slate-900">14</div>
                <div className="text-[11px] text-slate-500 mt-1">Excludes pull requests</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase text-slate-500 mb-1">Open PRs</div>
                <div className="text-2xl font-bold text-slate-900">6</div>
                <div className="text-[11px] text-slate-500 mt-1">Under active review</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase text-slate-500 mb-1">Merged PRs</div>
                <div className="text-2xl font-bold text-emerald-600">42</div>
                <div className="text-[11px] text-slate-500 mt-1">Past 30 days</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase text-slate-500 mb-1">Avg Merge Time</div>
                <div className="text-2xl font-bold text-purple-600">18.4h</div>
                <div className="text-[11px] text-slate-500 mt-1">Fast turnaround</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm col-span-2 sm:col-span-1">
                <div className="text-[11px] font-semibold uppercase text-slate-500 mb-1">Recent Commits</div>
                <div className="text-2xl font-bold text-blue-600">86</div>
                <div className="text-[11px] text-slate-500 mt-1">Active branch cadence</div>
              </div>
            </div>

            {/* Bottlenecks Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Identified Collaboration Bottlenecks (2)
                </h4>
                <span className="text-xs text-slate-500 font-mono">Real-time evaluation rules</span>
              </div>

              <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 text-amber-700 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">
                        #142: Database connection pool migration to async driver
                      </span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                        Warning
                      </span>
                      <span className="text-xs text-slate-500 font-mono">18 days inactive</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      This pull request has been open for 18 days without updates or merges. Overdue based on the 14-day threshold.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-700 shrink-0">View on GitHub &rarr;</span>
              </div>

              <div className="bg-rose-50/40 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0 text-rose-700 mt-0.5">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">
                        #89: Session token validation and CSRF cookie rotation
                      </span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                        Review Inactivity
                      </span>
                      <span className="text-xs text-slate-500 font-mono">9 days without review</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Pull request review submitted with changes requested 9 days ago with no subsequent review activity.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-700 shrink-0">View on GitHub &rarr;</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Platform Capabilities */}
      <section className="py-16 sm:py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
              Core Capabilities
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mt-3">
              Purpose-Built for Engineering Teams
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              From individual developer repositories to shared university capstones and sprint teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Capability 1 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center mb-4">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Repository Health Scoring
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Evaluates pull request velocity, merge cadence, issue hygiene, and recent default branch commits using deterministic, transparent math.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                <span>0–100 Health Engine</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Capability 2 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Explainable Bottlenecks
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Clear, human-readable explanations for stale issues (&gt; 30d), overdue pull requests (&gt; 14d), and verified review deadlocks (&gt; 7d).
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                <span>Direct GitHub Links</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Capability 3 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Historical Snapshots
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Save immutable point-in-time health reports to monitor team progression sprint over sprint or preserve evidence for university evaluation.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 text-[11px] font-semibold text-blue-700 flex items-center gap-1">
                <span>Immutable Persistence</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Capability 4 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center mb-4">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Team Workspaces & Invites
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Collaborate in shared project workspaces with single-use cryptographic invitation links, role separation (Owner vs Member), and shared repos.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 text-[11px] font-semibold text-purple-700 flex items-center gap-1">
                <span>SHA-256 Single-Use Tokens</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
            Simple Workflow
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mt-3">
            Three Steps to Engineering Clarity
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative">
            <div className="text-4xl font-black text-slate-200 mb-3 font-mono">01</div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Connect Any Public Repo</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter any GitHub repository format like <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700">facebook/react</code> or paste the full browser URL.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative">
            <div className="text-4xl font-black text-slate-200 mb-3 font-mono">02</div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Instant Real-Time Audit</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              DevPulse queries the live GitHub REST API to compute turnaround duration, review deadlocks, and stale issue warnings.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative">
            <div className="text-4xl font-black text-slate-200 mb-3 font-mono">03</div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Share & Track with Teammates</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Save snapshots to a shared workspace, invite teammates via single-use invite tokens, and track progress over time.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready to streamline your engineering collaboration?
          </h2>
          <p className="mt-3 text-emerald-100 text-sm max-w-xl mx-auto">
            Get started in seconds. No complex OAuth setup or credit cards needed for public repositories.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-sm px-6 py-3 rounded-lg shadow transition"
            >
              <span>{isAuthenticated ? 'Open Personal Dashboard' : 'Create Free Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            {!isAuthenticated && (
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-700/60 hover:bg-emerald-700 text-white border border-emerald-400/40 font-semibold text-sm px-6 py-3 rounded-lg transition"
              >
                <span>Sign In to Existing Account</span>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
