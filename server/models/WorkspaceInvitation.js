const mongoose = require('mongoose');

const workspaceInvitationSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace reference is required'],
      index: true
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Inviting user is required']
    },
    // Store ONLY the hex digest of sha256(rawToken), NEVER raw plaintext token
    tokenHash: {
      type: String,
      required: [true, 'Token hash is required'],
      unique: true,
      index: true,
      select: false // Exclude from query results by default to prevent leakage
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'revoked'],
      default: 'pending',
      required: true,
      index: true
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    acceptedAt: {
      type: Date,
      default: null
    },
    revokedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Safe JSON serialization (never leak tokenHash)
workspaceInvitationSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.tokenHash;
  delete obj.__v;
  return obj;
};

const WorkspaceInvitation = mongoose.model('WorkspaceInvitation', workspaceInvitationSchema);

module.exports = WorkspaceInvitation;
