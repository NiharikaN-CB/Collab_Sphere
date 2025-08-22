const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
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
  skills: [{
    name: {
      type: String,
      required: true
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Intermediate'
    },
    category: {
      type: String,
      enum: ['Programming', 'Design', 'Research', 'Writing', 'Analysis', 'Management', 'Other'],
      default: 'Other'
    }
  }],
  interests: [{
    type: String,
    trim: true
  }],
  availability: {
    type: String,
    enum: ['Available', 'Busy', 'Unavailable', 'Looking for projects'],
    default: 'Available'
  },
  maxProjects: {
    type: Number,
    min: [1, 'Maximum projects must be at least 1'],
    max: [10, 'Maximum projects cannot exceed 10'],
    default: 3
  },
  pastProjects: [{
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    },
    role: String,
    completionDate: Date,
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
  }],
  isAdmin: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update last active time
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save();
};

// Check if user can join more projects
userSchema.methods.canJoinProject = function() {
  return this.status === 'Active' && 
         this.availability !== 'Unavailable' &&
         this.pastProjects.filter(p => !p.completionDate).length < this.maxProjects;
};

module.exports = mongoose.model('User', userSchema);
