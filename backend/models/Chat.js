const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Message sender is required']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  messageType: {
    type: String,
    enum: ['Text', 'File', 'System', 'Notification'],
    default: 'Text'
  },
  fileUrl: {
    type: String
  },
  fileName: {
    type: String
  },
  fileSize: {
    type: Number
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, {
  timestamps: true
});

// Virtual for is read by user
messageSchema.virtual('isReadByUser').get(function() {
  return function(userId) {
    return this.readBy.some(read => read.user.toString() === userId.toString());
  };
});

// Method to mark as read by user
messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(read => 
    read.user.toString() === userId.toString()
  );
  
  if (!existingRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
  }
  
  return this.save();
};

// Method to edit message
messageSchema.methods.edit = function(newContent) {
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  return this.save();
};

const chatSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project is required'],
    unique: true
  },
  messages: [messageSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    isTyping: {
      type: Boolean,
      default: false
    }
  }],
  settings: {
    allowFileSharing: {
      type: Boolean,
      default: true
    },
    maxFileSize: {
      type: Number,
      default: 10485760 // 10MB
    },
    allowedFileTypes: [{
      type: String,
      default: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mp3']
    }]
  }
}, {
  timestamps: true
});

// Virtual for unread count for a user
chatSchema.virtual('unreadCountForUser').get(function() {
  return function(userId) {
    return this.messages.filter(message => 
      !message.isReadByUser(userId) && 
      message.sender.toString() !== userId.toString()
    ).length;
  };
});

// Virtual for last message
chatSchema.virtual('lastMessage').get(function() {
  return this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;
});

// Method to add message
chatSchema.methods.addMessage = function(messageData) {
  const message = new messageSchema(messageData);
  this.messages.push(message);
  this.lastMessageAt = new Date();
  
  // Update last seen for sender
  const participant = this.participants.find(p => 
    p.user.toString() === messageData.sender.toString()
  );
  if (participant) {
    participant.lastSeen = new Date();
  }
  
  return this.save();
};

// Method to add participant
chatSchema.methods.addParticipant = function(userId) {
  const existingParticipant = this.participants.find(p => 
    p.user.toString() === userId.toString()
  );
  
  if (!existingParticipant) {
    this.participants.push({
      user: userId,
      joinedAt: new Date(),
      lastSeen: new Date()
    });
  }
  
  return this.save();
};

// Method to remove participant
chatSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => 
    p.user.toString() !== userId.toString()
  );
  return this.save();
};

// Method to update participant typing status
chatSchema.methods.updateTypingStatus = function(userId, isTyping) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString()
  );
  
  if (participant) {
    participant.isTyping = isTyping;
    return this.save();
  }
  
  return this;
};

// Method to update participant last seen
chatSchema.methods.updateLastSeen = function(userId) {
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString()
  );
  
  if (participant) {
    participant.lastSeen = new Date();
    return this.save();
  }
  
  return this;
};

// Method to get recent messages
chatSchema.methods.getRecentMessages = function(limit = 50) {
  return this.messages
    .sort({ createdAt: -1 })
    .slice(0, limit)
    .reverse();
};

// Method to search messages
chatSchema.methods.searchMessages = function(query, userId) {
  const regex = new RegExp(query, 'i');
  return this.messages.filter(message => 
    message.content.match(regex) && 
    message.sender.toString() === userId.toString()
  );
};

// Index for efficient queries
chatSchema.index({ project: 1 });
chatSchema.index({ 'messages.createdAt': -1 });
chatSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);
