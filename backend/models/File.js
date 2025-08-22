const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'Filename is required'],
    trim: true
  },
  originalName: {
    type: String,
    required: [true, 'Original filename is required']
  },
  filePath: {
    type: String,
    required: [true, 'File path is required']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required']
  },
  fileExtension: {
    type: String,
    required: [true, 'File extension is required']
  },
  
  // Project and User Information
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project is required']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required']
  },
  
  // File Metadata
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: ['Document', 'Image', 'Video', 'Audio', 'Code', 'Data', 'Other'],
    default: 'Other'
  },
  
  // Access Control
  isPublic: {
    type: Boolean,
    default: true
  },
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // File Status
  status: {
    type: String,
    enum: ['Active', 'Archived', 'Deleted'],
    default: 'Active'
  },
  
  // Download and View Tracking
  downloadCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  lastDownloaded: {
    type: Date
  },
  lastViewed: {
    type: Date
  },
  
  // Version Control
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    filePath: String,
    version: Number,
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Security
  checksum: {
    type: String
  },
  isVirusScanned: {
    type: Boolean,
    default: false
  },
  virusScanResult: {
    type: String,
    enum: ['Clean', 'Infected', 'Suspicious', 'Not Scanned'],
    default: 'Not Scanned'
  }
}, {
  timestamps: true
});

// Virtual for file size in human readable format
fileSchema.virtual('fileSizeFormatted').get(function() {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (this.fileSize === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
  return Math.round(this.fileSize / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual for is image
fileSchema.virtual('isImage').get(function() {
  return this.mimeType.startsWith('image/');
});

// Virtual for is video
fileSchema.virtual('isVideo').get(function() {
  return this.mimeType.startsWith('video/');
});

// Virtual for is audio
fileSchema.virtual('isAudio').get(function() {
  return this.mimeType.startsWith('audio/');
});

// Virtual for is document
fileSchema.virtual('isDocument').get(function() {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/rtf'
  ];
  return documentTypes.includes(this.mimeType);
});

// Virtual for is code
fileSchema.virtual('isCode').get(function() {
  const codeExtensions = [
    'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go',
    'rs', 'swift', 'kt', 'scala', 'html', 'css', 'scss', 'sass', 'json', 'xml',
    'sql', 'sh', 'bat', 'ps1', 'yml', 'yaml', 'toml', 'ini', 'cfg', 'conf'
  ];
  return codeExtensions.includes(this.fileExtension.toLowerCase());
});

// Method to increment download count
fileSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  this.lastDownloaded = new Date();
  return this.save();
};

// Method to increment view count
fileSchema.methods.incrementView = function() {
  this.viewCount += 1;
  this.lastViewed = new Date();
  return this.save();
};

// Method to check if user can access file
fileSchema.methods.canUserAccess = function(userId) {
  if (this.isPublic) return true;
  if (this.uploadedBy.toString() === userId.toString()) return true;
  if (this.allowedUsers.some(user => user.toString() === userId.toString())) return true;
  return false;
};

// Method to add allowed user
fileSchema.methods.addAllowedUser = function(userId) {
  if (!this.allowedUsers.some(user => user.toString() === userId.toString())) {
    this.allowedUsers.push(userId);
    return this.save();
  }
  return this;
};

// Method to remove allowed user
fileSchema.methods.removeAllowedUser = function(userId) {
  this.allowedUsers = this.allowedUsers.filter(user => 
    user.toString() !== userId.toString()
  );
  return this.save();
};

// Method to create new version
fileSchema.methods.createNewVersion = function(newFilePath, uploadedBy) {
  // Store current version in previous versions
  this.previousVersions.push({
    filePath: this.filePath,
    version: this.version,
    uploadedAt: this.updatedAt,
    uploadedBy: this.uploadedBy
  });
  
  // Update current version
  this.filePath = newFilePath;
  this.uploadedBy = uploadedBy;
  this.version += 1;
  this.uploadedAt = new Date();
  
  return this.save();
};

// Method to archive file
fileSchema.methods.archive = function() {
  this.status = 'Archived';
  return this.save();
};

// Method to restore file
fileSchema.methods.restore = function() {
  this.status = 'Active';
  return this.save();
};

// Static method to find files by project
fileSchema.statics.findByProject = function(projectId, userId) {
  return this.find({
    project: projectId,
    status: 'Active',
    $or: [
      { isPublic: true },
      { uploadedBy: userId },
      { allowedUsers: userId }
    ]
  }).populate('uploadedBy', 'firstName lastName avatar')
    .sort({ createdAt: -1 });
};

// Static method to find files by user
fileSchema.statics.findByUser = function(userId) {
  return this.find({
    $or: [
      { uploadedBy: userId },
      { allowedUsers: userId }
    ],
    status: 'Active'
  }).populate('project', 'title category')
    .populate('uploadedBy', 'firstName lastName avatar')
    .sort({ createdAt: -1 });
};

// Index for efficient queries
fileSchema.index({ project: 1, status: 1 });
fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ filename: 'text', description: 'text', tags: 'text' });
fileSchema.index({ createdAt: -1 });
fileSchema.index({ fileSize: -1 });

module.exports = mongoose.model('File', fileSchema);
