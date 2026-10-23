const mongoose = require('mongoose');

const savedRepositorySchema = new mongoose.Schema(
  {
    // Scope distinguishes personal dashboard repos from team workspace shared repos
    scope: {
      type: String,
      enum: ['personal', 'workspace'],
      default: 'personal',
      required: true,
      index: true
    },
    // Associated personal user (set for personal scope)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    // Associated workspace (set for workspace scope)
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      default: null,
      index: true
    },
    // User who added the repository
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    owner: {
      type: String,
      required: [true, 'Repository owner is required'],
      trim: true,
      lowercase: true
    },
    repo: {
      type: String,
      required: [true, 'Repository name is required'],
      trim: true,
      lowercase: true
    },
    fullName: {
      type: String,
      required: [true, 'Repository full name is required'],
      trim: true,
      lowercase: true
    },
    url: {
      type: String,
      required: [true, 'Repository URL is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    stars: {
      type: Number,
      default: 0
    },
    forks: {
      type: Number,
      default: 0
    },
    openIssuesCount: {
      type: Number,
      default: 0
    },
    defaultBranch: {
      type: String,
      default: 'main',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

// Compound unique indexes:
// 1. A user cannot save the same repository multiple times in their personal dashboard
savedRepositorySchema.index(
  { user: 1, fullName: 1 },
  { unique: true, partialFilterExpression: { scope: 'personal' } }
);

// 2. A workspace cannot have duplicate entries of the same repository
savedRepositorySchema.index(
  { workspace: 1, fullName: 1 },
  { unique: true, partialFilterExpression: { scope: 'workspace' } }
);

const SavedRepository = mongoose.model('SavedRepository', savedRepositorySchema);

module.exports = SavedRepository;
