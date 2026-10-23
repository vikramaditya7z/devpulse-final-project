const mongoose = require('mongoose');

const workspaceMemberSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace reference is required'],
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    role: {
      type: String,
      enum: {
        values: ['owner', 'member'],
        message: '{VALUE} is not a valid workspace role. Must be owner or member.'
      },
      default: 'member',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index: a user can only be a member of a given workspace once
workspaceMemberSchema.index({ workspace: 1, user: 1 }, { unique: true });

const WorkspaceMember = mongoose.model('WorkspaceMember', workspaceMemberSchema);

module.exports = WorkspaceMember;
