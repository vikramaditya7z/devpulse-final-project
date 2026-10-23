const mongoose = require('mongoose');

const healthReportSchema = new mongoose.Schema(
  {
    repository: {
      owner: { type: String, required: true, trim: true },
      repo: { type: String, required: true, trim: true },
      fullName: { type: String, required: true, trim: true },
      url: { type: String, required: true, trim: true },
      description: { type: String, default: '', trim: true },
      defaultBranch: { type: String, default: 'main', trim: true }
    },
    scope: {
      type: String,
      enum: ['personal', 'workspace'],
      required: true,
      index: true
    },
    // Associated personal user (set when scope === 'personal')
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    // Associated team workspace (set when scope === 'workspace')
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      default: null,
      index: true
    },
    // User who triggered report generation
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Report creator is required'],
      index: true
    },
    // Immutable Metrics Snapshot
    metrics: {
      healthScore: { type: Number, required: true },
      healthStatus: { type: String, required: true },
      openIssuesCount: { type: Number, required: true },
      openPullRequestsCount: { type: Number, required: true },
      mergedPullRequestsCount: { type: Number, required: true },
      averagePRMergeTimeHours: { type: Number, default: 0 },
      recentCommitsCount: { type: Number, required: true },
      totalFindingsCount: { type: Number, default: 0 },
      criticalFindingsCount: { type: Number, default: 0 },
      warningFindingsCount: { type: Number, default: 0 }
    },
    // Immutable Explainable Bottlenecks Snapshot
    findings: [
      {
        type: { type: String, required: true },
        severity: { type: String, required: true },
        itemNumber: { type: Number },
        title: { type: String, required: true },
        url: { type: String },
        relevantDates: { type: mongoose.Schema.Types.Mixed },
        daysInactive: { type: Number },
        explanation: { type: String, required: true }
      }
    ],
    reportingPeriodDays: {
      type: Number,
      default: 30,
      required: true
    },
    status: {
      type: String,
      enum: ['complete', 'partial'],
      default: 'complete',
      required: true
    },
    statusMessage: {
      type: String,
      default: ''
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast querying
healthReportSchema.index({ user: 1, generatedAt: -1 });
healthReportSchema.index({ workspace: 1, generatedAt: -1 });

const HealthReport = mongoose.model('HealthReport', healthReportSchema);

module.exports = HealthReport;
