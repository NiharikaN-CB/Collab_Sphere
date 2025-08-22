const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Blocked'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  dueDate: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Project category is required'],
    enum: ['Research', 'Software Development', 'Design', 'Writing', 'Analysis', 'Other']
  },
  
  // Project Details
  institution: {
    type: String,
    required: [true, 'Institution is required']
  },
  fieldOfStudy: {
    type: String,
    required: [true, 'Field of study is required']
  },
  academicLevel: {
    type: String,
    enum: ['Undergraduate', 'Graduate', 'PhD', 'PostDoc', 'Faculty'],
    required: [true, 'Academic level is required']
  },
  
  // Team and Collaboration
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Project creator is required']
  },
  teamMembers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      required: true,
      enum: ['Leader', 'Developer', 'Designer', 'Researcher', 'Writer', 'Analyst', 'Member']
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Left'],
      default: 'Active'
    }
  }],
  
  // Requirements and Skills
  requiredSkills: [{
    name: {
      type: String,
      required: true
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Intermediate'
    },
    isRequired: {
      type: Boolean,
      default: true
    }
  }],
  
  // Project Management
  status: {
    type: String,
    enum: ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'],
    default: 'Planning'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  
  // Timeline
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  estimatedDuration: {
    type: Number, // in weeks
    min: [1, 'Duration must be at least 1 week']
  },
  
  // Progress Tracking
  progress: {
    type: Number,
    min: [0, 'Progress cannot be negative'],
    max: [100, 'Progress cannot exceed 100%'],
    default: 0
  },
  tasks: [taskSchema],
  
  // Collaboration Features
  maxTeamSize: {
    type: Number,
    min: [2, 'Team size must be at least 2'],
    max: [20, 'Team size cannot exceed 20'],
    default: 5
  },
  isOpenToJoin: {
    type: Boolean,
    default: true
  },
  
  // Communication
  chatEnabled: {
    type: Boolean,
    default: true
  },
  fileSharingEnabled: {
    type: Boolean,
    default: true
  },
  
  // Tags and Search
  tags: [{
    type: String,
    trim: true
  }],
  
  // Visibility
  isPublic: {
    type: Boolean,
    default: true
  },
  allowCrossInstitution: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for team size
projectSchema.virtual('currentTeamSize').get(function() {
  return this.teamMembers.filter(member => member.status === 'Active').length;
});

// Virtual for available spots
projectSchema.virtual('availableSpots').get(function() {
  return this.maxTeamSize - this.currentTeamSize;
});

// Virtual for days remaining
projectSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return null;
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Virtual for completion status
projectSchema.virtual('isCompleted').get(function() {
  return this.status === 'Completed';
});

// Virtual for is overdue
projectSchema.virtual('isOverdue').get(function() {
  if (!this.endDate || this.status === 'Completed') return false;
  return new Date() > new Date(this.endDate);
});

// Index for search functionality
projectSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
  category: 'text',
  fieldOfStudy: 'text'
});

// Method to add team member
projectSchema.methods.addTeamMember = function(userId, role) {
  if (this.currentTeamSize >= this.maxTeamSize) {
    throw new Error('Project team is full');
  }
  
  const existingMember = this.teamMembers.find(member => 
    member.user.toString() === userId.toString()
  );
  
  if (existingMember) {
    throw new Error('User is already a team member');
  }
  
  this.teamMembers.push({
    user: userId,
    role: role,
    joinedAt: new Date(),
    status: 'Active'
  });
  
  return this.save();
};

// Method to remove team member
projectSchema.methods.removeTeamMember = function(userId) {
  const memberIndex = this.teamMembers.findIndex(member => 
    member.user.toString() === userId.toString()
  );
  
  if (memberIndex === -1) {
    throw new Error('User is not a team member');
  }
  
  this.teamMembers[memberIndex].status = 'Left';
  return this.save();
};

// Method to update progress
projectSchema.methods.updateProgress = function() {
  if (this.tasks.length === 0) {
    this.progress = 0;
  } else {
    const completedTasks = this.tasks.filter(task => task.status === 'Completed').length;
    this.progress = Math.round((completedTasks / this.tasks.length) * 100);
  }
  
  return this.save();
};

// Method to check if user can join
projectSchema.methods.canUserJoin = function(userId) {
  if (!this.isOpenToJoin) return false;
  if (this.currentTeamSize >= this.maxTeamSize) return false;
  
  const isAlreadyMember = this.teamMembers.some(member => 
    member.user.toString() === userId.toString() && member.status === 'Active'
  );
  
  return !isAlreadyMember;
};

module.exports = mongoose.model('Project', projectSchema);
