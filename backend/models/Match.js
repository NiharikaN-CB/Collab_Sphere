const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requester is required']
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project is required']
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'Expired'],
    default: 'Pending'
  },
  message: {
    type: String,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  matchScore: {
    type: Number,
    min: [0, 'Match score cannot be negative'],
    max: [100, 'Match score cannot exceed 100'],
    required: true
  },
  matchReason: {
    type: String,
    enum: ['Skills Match', 'Interest Match', 'Availability Match', 'Quick Match', 'AI Recommendation'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      // Default expiration: 7 days from creation
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date;
    }
  },
  respondedAt: {
    type: Date
  },
  responseMessage: {
    type: String,
    maxlength: [500, 'Response message cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Index for efficient queries
matchSchema.index({ requester: 1, recipient: 1, project: 1 });
matchSchema.index({ status: 1, expiresAt: 1 });
matchSchema.index({ matchScore: -1 });

// Virtual for is expired
matchSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

// Virtual for days until expiration
matchSchema.virtual('daysUntilExpiration').get(function() {
  const now = new Date();
  const diffTime = this.expiresAt - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Method to accept match
matchSchema.methods.accept = function(responseMessage = '') {
  if (this.status !== 'Pending') {
    throw new Error('Match cannot be accepted - invalid status');
  }
  
  if (this.isExpired) {
    throw new Error('Match has expired');
  }
  
  this.status = 'Accepted';
  this.respondedAt = new Date();
  this.responseMessage = responseMessage;
  
  return this.save();
};

// Method to reject match
matchSchema.methods.reject = function(responseMessage = '') {
  if (this.status !== 'Pending') {
    throw new Error('Match cannot be rejected - invalid status');
  }
  
  this.status = 'Rejected';
  this.respondedAt = new Date();
  this.responseMessage = responseMessage;
  
  return this.save();
};

// Method to expire match
matchSchema.methods.expire = function() {
  if (this.status === 'Pending') {
    this.status = 'Expired';
    return this.save();
  }
  return this;
};

// Static method to find active matches for a user
matchSchema.statics.findActiveMatches = function(userId) {
  return this.find({
    $or: [{ requester: userId }, { recipient: userId }],
    status: 'Pending',
    expiresAt: { $gt: new Date() }
  }).populate('requester', 'firstName lastName avatar institution')
    .populate('recipient', 'firstName lastName avatar institution')
    .populate('project', 'title description category');
};

// Static method to find pending matches for a user
matchSchema.statics.findPendingMatches = function(userId) {
  return this.find({
    recipient: userId,
    status: 'Pending',
    expiresAt: { $gt: new Date() }
  }).populate('requester', 'firstName lastName avatar institution skills')
    .populate('project', 'title description category requiredSkills');
};

// Static method to find match suggestions
matchSchema.statics.findSuggestions = function(userId, projectId, limit = 10) {
  return this.find({
    requester: userId,
    project: projectId,
    status: { $in: ['Accepted', 'Pending'] }
  }).populate('recipient', 'firstName lastName avatar institution skills availability')
    .populate('project', 'title description category')
    .sort({ matchScore: -1, createdAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Match', matchSchema);
