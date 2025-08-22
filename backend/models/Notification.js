const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Notification recipient is required']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'Match Request',
      'Match Response',
      'Project Invitation',
      'Project Update',
      'Task Assignment',
      'Message Received',
      'File Shared',
      'Partner Replacement',
      'System Alert',
      'Deadline Reminder'
    ],
    required: [true, 'Notification type is required']
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  
  // Related entities
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match'
  },
  task: {
    type: mongoose.Schema.Types.ObjectId
  },
  file: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  },
  
  // Notification settings
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  category: {
    type: String,
    enum: ['Social', 'Project', 'System', 'Urgent'],
    default: 'Social'
  },
  
  // Status and interaction
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date
  },
  
  // Action buttons (for interactive notifications)
  actions: [{
    label: {
      type: String,
      required: true
    },
    action: {
      type: String,
      required: true,
      enum: ['Accept', 'Reject', 'View', 'Reply', 'Join', 'Leave', 'Download']
    },
    url: String,
    data: mongoose.Schema.Types.Mixed
  }],
  
  // Expiration and scheduling
  expiresAt: {
    type: Date
  },
  scheduledFor: {
    type: Date
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ scheduledFor: 1 });

// Virtual for is expired
notificationSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Virtual for is scheduled
notificationSchema.virtual('isScheduled').get(function() {
  if (!this.scheduledFor) return false;
  return new Date() < this.scheduledFor;
});

// Virtual for can be displayed
notificationSchema.virtual('canDisplay').get(function() {
  if (this.isArchived) return false;
  if (this.isExpired) return false;
  if (this.isScheduled) return false;
  return true;
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return this;
};

// Method to mark as unread
notificationSchema.methods.markAsUnread = function() {
  this.isRead = false;
  this.readAt = undefined;
  return this.save();
};

// Method to archive
notificationSchema.methods.archive = function() {
  this.isArchived = true;
  this.archivedAt = new Date();
  return this.save();
};

// Method to unarchive
notificationSchema.methods.unarchive = function() {
  this.isArchived = false;
  this.archivedAt = undefined;
  return this.save();
};

// Method to add action
notificationSchema.methods.addAction = function(actionData) {
  this.actions.push(actionData);
  return this.save();
};

// Method to remove action
notificationSchema.methods.removeAction = function(actionIndex) {
  if (actionIndex >= 0 && actionIndex < this.actions.length) {
    this.actions.splice(actionIndex, 1);
    return this.save();
  }
  return this;
};

// Static method to create match request notification
notificationSchema.statics.createMatchRequest = function(recipientId, senderId, projectId, matchId) {
  return this.create({
    recipient: recipientId,
    sender: senderId,
    type: 'Match Request',
    title: 'New Partner Request',
    message: 'Someone wants to collaborate with you on a project!',
    project: projectId,
    match: matchId,
    priority: 'High',
    category: 'Social',
    actions: [
      {
        label: 'View Request',
        action: 'View',
        url: `/matching/${matchId}`
      },
      {
        label: 'Accept',
        action: 'Accept',
        url: `/matching/${matchId}/accept`
      },
      {
        label: 'Reject',
        action: 'Reject',
        url: `/matching/${matchId}/reject`
      }
    ]
  });
};

// Static method to create project update notification
notificationSchema.statics.createProjectUpdate = function(recipientId, projectId, updateType, details) {
  const updateMessages = {
    'status_change': 'Project status has been updated',
    'member_joined': 'A new member joined the project',
    'member_left': 'A member left the project',
    'task_completed': 'A task has been completed',
    'deadline_approaching': 'Project deadline is approaching',
    'file_shared': 'A new file has been shared'
  };

  return this.create({
    recipient: recipientId,
    type: 'Project Update',
    title: 'Project Update',
    message: updateMessages[updateType] || 'Project has been updated',
    project: projectId,
    priority: 'Medium',
    category: 'Project',
    actions: [
      {
        label: 'View Project',
        action: 'View',
        url: `/projects/${projectId}`
      }
    ],
    metadata: { updateType, details }
  });
};

// Static method to create deadline reminder
notificationSchema.statics.createDeadlineReminder = function(recipientId, projectId, daysRemaining) {
  let message = 'Project deadline is approaching';
  let priority = 'Medium';
  
  if (daysRemaining <= 1) {
    message = 'Project deadline is tomorrow!';
    priority = 'Critical';
  } else if (daysRemaining <= 3) {
    message = `Project deadline is in ${daysRemaining} days`;
    priority = 'High';
  } else if (daysRemaining <= 7) {
    message = `Project deadline is in ${daysRemaining} days`;
    priority = 'Medium';
  }

  return this.create({
    recipient: recipientId,
    type: 'Deadline Reminder',
    title: 'Deadline Reminder',
    message: message,
    project: projectId,
    priority: priority,
    category: 'Urgent',
    actions: [
      {
        label: 'View Project',
        action: 'View',
        url: `/projects/${projectId}`
      }
    ],
    metadata: { daysRemaining }
  });
};

// Static method to find unread notifications for user
notificationSchema.statics.findUnread = function(userId, limit = 20) {
  return this.find({
    recipient: userId,
    isRead: false,
    isArchived: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  }).populate('sender', 'firstName lastName avatar')
    .populate('project', 'title category')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to find all notifications for user
notificationSchema.statics.findByUser = function(userId, options = {}) {
  const query = {
    recipient: userId,
    isArchived: options.archived || false
  };

  if (options.type) {
    query.type = options.type;
  }

  if (options.read !== undefined) {
    query.isRead = options.read;
  }

  return this.find(query)
    .populate('sender', 'firstName lastName avatar')
    .populate('project', 'title category')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

// Static method to mark all notifications as read for user
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

// Static method to clean up expired notifications
notificationSchema.statics.cleanupExpired = function() {
  return this.updateMany(
    { expiresAt: { $lt: new Date() } },
    { isArchived: true, archivedAt: new Date() }
  );
};

module.exports = mongoose.model('Notification', notificationSchema);
