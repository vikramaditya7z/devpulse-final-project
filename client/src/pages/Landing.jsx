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
  Zap,
  BarChart3,
  Sliders,
  Terminal,
  Sparkles
} from 'lucide-react';

export const Landing = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-[#0a0d14] text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-14 pb-20 sm:pt-24 sm:pb-28 border-b border-slate-800/80 bg-radial-gradient bg-grid-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-6 shadow-sm shadow-emerald-950/50 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              DevPulse v2.0 · Intelligent GitHub Health & Collaboration Analytics
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
              Understand the health of your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                GitHub projects
              </span>.
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
              DevPulse turns live GitHub pull request velocity, backlog staleness, and commit cadence into explainable health scores, actionable bottleneck triage, and persistent team workspace reports.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-lg shadow-emerald-950/60 border border-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition"
                >
                  <span>Open Personal Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-lg shadow-emerald-950/60 border border-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#121826] hover:bg-[#161f33] text-slate-200 font-semibold text-sm px-6 py-3 rounded-xl border border-slate-700/80 shadow-md transition"
                  >
                    <span>Sign In</span>
                  </Link>
                </>
              )}
              <a
                href="#demo-preview"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-slate-400 hover:text-white font-semibold text-sm px-5 py-3 rounded-xl hover:bg-slate-800/60 transition"
              >
                <span>Explore Live Preview</span>
                <BarChart3 className="w-4 h-4 text-emerald-400" />
              </a>
            </div>

            {/* Invariant Trust Points */}
            <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-y-2.5 gap-x-8 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                100% Deterministic Scoring
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Zero Hallucinated Metrics
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Single-Use Cryptographic Invites
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Realistic UI Preview Section */}
      <section id="demo-preview" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/25 mb-2.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            Live Analytical Instrument
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Multidimensional Repository Intelligence
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Every health score combines normalized PR velocity, backlog hygiene, commit cadence, and review responsiveness.
          </p>
        </div>

        {/* Mock Application Container */}
        <div className="bg-[#0e1320] rounded-2xl border border-slate-800 shadow-2xl shadow-black/80 overflow-hidden">
          {/* Mock Window Top Bar */}
          <div className="bg-[#090d16] border-b border-slate-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono font-medium text-slate-400">
                devpulse.app/repo/acme-org/backend-service
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Sample Demonstration Data</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Repo Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    acme-org/backend-service
                  </h3>
                  <span className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                    main
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  High-throughput payment orchestration and microservice event hub.
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    4,820 stars
                  </span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <GitFork className="w-3.5 h-3.5 text-cyan-400" />
                    942 forks
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Reporting window: Past 30 days</span>
              </div>
            </div>

            {/* Score & Dimensions Banner */}
            <div className="bg-[#121827] border border-slate-800/90 rounded-xl p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-18 h-18 rounded-xl bg-slate-900 border border-emerald-500/40 shadow-inner flex flex-col items-center justify-center shrink-0 p-3">
                  <span className="text-3xl font-black text-emerald-400 font-mono">88</span>
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">/ 100</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white">Healthy Repository Status</h4>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Healthy
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed">
                    Strong pull request turnaround velocity and active continuous integration. 2 minor backlog items flagged.
                  </p>
                </div>
              </div>

              {/* Dimensional Progress Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs w-full lg:w-auto lg:min-w-[340px]">
                <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">PR Velocity</span>
                    <span className="text-emerald-400 font-mono font-bold">86%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '86%' }} />
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Backlog Hygiene</span>
                    <span className="text-cyan-400 font-mono font-bold">82%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: '82%' }} />
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Commit Cadence</span>
                    <span className="text-emerald-400 font-mono font-bold">100%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Review Responsiveness</span>
                    <span className="text-violet-400 font-mono font-bold">90%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-violet-500 h-full rounded-full" style={{ width: '90%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Vitals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="bg-[#121827] border border-slate-800/80 rounded-xl p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase text-slate-400 mb-1">Open Issues</div>
                <div className="text-2xl font-bold text-white font-mono">14</div>
                <div className="text-[11px] text-slate-500 mt-1">Excludes pull requests</div>
              </div>

              <div className="bg-[#121827] border border-slate-800/80 rounded-xl p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase text-slate-400 mb-1">Open PRs</div>
                <div className="text-2xl font-bold text-cyan-400 font-mono">6</div>
                <div className="text-[11px] text-slate-500 mt-1">Under active review</div>
              </div>

              <div className="bg-[#121827] border border-slate-800/80 rounded-xl p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase text-slate-400 mb-1">Merged PRs</div>
                <div className="text-2xl font-bold text-emerald-400 font-mono">42</div>
                <div className="text-[11px] text-slate-500 mt-1">Past 30 days</div>
              </div>

              <div className="bg-[#121827] border border-slate-800/80 rounded-xl p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase text-slate-400 mb-1">Avg Merge Time</div>
                <div className="text-2xl font-bold text-violet-400 font-mono">18.4h</div>
                <div className="text-[11px] text-slate-500 mt-1">Fast turnaround</div>
              </div>

              <div className="bg-[#121827] border border-slate-800/80 rounded-xl p-4 shadow-sm col-span-2 sm:col-span-1">
                <div className="text-[11px] font-semibold uppercase text-slate-400 mb-1">Recent Commits</div>
                <div className="text-2xl font-bold text-emerald-400 font-mono">86</div>
                <div className="text-[11px] text-slate-500 mt-1">Active branch cadence</div>
              </div>
            </div>

            {/* Bottlenecks Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Identified Collaboration Bottlenecks (2)
                </h4>
                <span className="text-xs text-slate-500 font-mono">Rule-based recommendations attached</span>
              </div>

              <div className="bg-[#121827] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">
                        #142: Database connection pool migration to async driver
                      </span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        Warning
                      </span>
                      <span className="text-xs text-slate-400 font-mono">18 days inactive</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Pull request open for 18 days without being merged (threshold: 14 days).
                    </p>
                    <div className="mt-2 text-xs bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                        Recommended Action
                      </span>
                      <span>Accelerate turnaround: Ping submitter to complete pending tests or review comments.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#121827] border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-400 mt-0.5">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">
                        #89: Session token validation and CSRF cookie rotation
                      </span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        Review Deadlock
                      </span>
                      <span className="text-xs text-slate-400 font-mono">9 days without review</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Pull request review submitted with changes requested 9 days ago with no subsequent review activity.
                    </p>
                    <div className="mt-2 text-xs bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                        Recommended Action
                      </span>
                      <span>Resolve deadlock: Reviews requested 9d ago. Reassign reviewer or request team lead approval.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Platform Capabilities */}
      <section className="py-16 sm:py-24 bg-[#080b12] border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/25">
              Core Capabilities
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white mt-3">
              Purpose-Built for Engineering Teams
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              From individual developer repositories to shared university capstones and sprint teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Capability 1 */}
            <div className="bg-[#101625] border border-slate-800/90 rounded-2xl p-6 shadow-md hover:border-slate-700 transition flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Repository Health Scoring
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Evaluates pull request turnaround velocity, merge throughput, backlog hygiene, and commit cadence using transparent, bounded mathematical formulas.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <span>4-Dimensional Engine</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Capability 2 */}
            <div className="bg-[#101625] border border-slate-800/90 rounded-2xl p-6 shadow-md hover:border-slate-700 transition flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Actionable Bottlenecks
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Clear explanations for stale issues (&gt; 30d), overdue pull requests (&gt; 14d), and verified review deadlocks (&gt; 7d), paired with concrete next actions.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                <span>Rule-Based Recommendations</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Capability 3 */}
            <div className="bg-[#101625] border border-slate-800/90 rounded-2xl p-6 shadow-md hover:border-slate-700 transition flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-400 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Historical Snapshots
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Preserve immutable point-in-time health reports to monitor team progression sprint over sprint or submit verification evidence for academic grading.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] font-semibold text-violet-400 flex items-center gap-1">
                <span>Immutable Persistence</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            {/* Capability 4 */}
            <div className="bg-[#101625] border border-slate-800/90 rounded-2xl p-6 shadow-md hover:border-slate-700 transition flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-105 transition">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Team Workspaces & Invites
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Collaborate in shared project workspaces with single-use cryptographic invitation links, role separation (Owner vs Member), and shared repos.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] font-semibold text-cyan-400 flex items-center gap-1">
                <span>SHA-256 Single-Use Tokens</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/25">
            Operational Workflow
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white mt-3">
            Three Steps to Engineering Clarity
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="bg-[#101625] border border-slate-800/90 rounded-2xl p-6 shadow-md relative">
            <div className="text-4xl font-black text-slate-700/60 mb-3 font-mono">01</div>
            <h3 className="text-base font-bold text-white mb-2">Connect Any Public Repo</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter any GitHub repository format like <code className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-emerald-400">expressjs/express</code> or paste the full browser URL.
            </p>
          </div>

          <div className="bg-[#101625] border border-slate-800/90 rounded-2xl p-6 shadow-md relative">
            <div className="text-4xl font-black text-slate-700/60 mb-3 font-mono">02</div>
            <h3 className="text-base font-bold text-white mb-2">Instant Real-Time Audit</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              DevPulse queries the live GitHub REST API to compute turnaround duration, review deadlocks, and backlog staleness without caching stale figures.
            </p>
          </div>

          <div className="bg-[#101625] border border-slate-800/90 rounded-2xl p-6 shadow-md relative">
            <div className="text-4xl font-black text-slate-700/60 mb-3 font-mono">03</div>
            <h3 className="text-base font-bold text-white mb-2">Share & Track with Teammates</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Save snapshots to a shared workspace, invite teammates via single-use invite tokens, and track progress over time.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="bg-gradient-to-r from-emerald-950/60 via-[#101625] to-teal-950/60 border-t border-slate-800 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready to streamline your team's pull request velocity?
          </h2>
          <p className="mt-3 text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            Get started in seconds. No complex OAuth setup or credit cards needed for public repositories.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-7 py-3 rounded-xl shadow-lg shadow-emerald-950/70 border border-emerald-500/40 transition hover:scale-[1.02]"
            >
              <span>{isAuthenticated ? 'Open Personal Dashboard' : 'Create Free Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            {!isAuthenticated && (
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-semibold text-sm px-6 py-3 rounded-xl transition"
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
