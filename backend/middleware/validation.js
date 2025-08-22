const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid input data',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Validation rules for user registration
const validateRegistration = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('institution')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Institution must be between 2 and 100 characters'),
  
  body('fieldOfStudy')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Field of study must be between 2 and 100 characters'),
  
  body('academicLevel')
    .isIn(['Undergraduate', 'Graduate', 'PhD', 'PostDoc', 'Faculty'])
    .withMessage('Invalid academic level'),
  
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  
  body('skills.*.name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Skill name must be between 1 and 50 characters'),
  
  body('skills.*.level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
    .withMessage('Invalid skill level'),
  
  body('interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array'),
  
  body('interests.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Interest must be between 1 and 100 characters'),
  
  handleValidationErrors
];

// Validation rules for user login
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Validation rules for profile updates
const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('institution')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Institution must be between 2 and 100 characters'),
  
  body('fieldOfStudy')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Field of study must be between 2 and 100 characters'),
  
  body('academicLevel')
    .optional()
    .isIn(['Undergraduate', 'Graduate', 'PhD', 'PostDoc', 'Faculty'])
    .withMessage('Invalid academic level'),
  
  body('availability')
    .optional()
    .isIn(['Available', 'Busy', 'Unavailable', 'Looking for projects'])
    .withMessage('Invalid availability status'),
  
  body('maxProjects')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Maximum projects must be between 1 and 10'),
  
  handleValidationErrors
];

// Validation rules for project creation
const validateProjectCreation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Project title must be between 5 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('Project description must be between 20 and 1000 characters'),
  
  body('category')
    .isIn(['Research', 'Software Development', 'Design', 'Writing', 'Analysis', 'Other'])
    .withMessage('Invalid project category'),
  
  body('institution')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Institution must be between 2 and 100 characters'),
  
  body('fieldOfStudy')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Field of study must be between 2 and 100 characters'),
  
  body('academicLevel')
    .isIn(['Undergraduate', 'Graduate', 'PhD', 'PostDoc', 'Faculty'])
    .withMessage('Invalid academic level'),
  
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('estimatedDuration')
    .optional()
    .isInt({ min: 1, max: 52 })
    .withMessage('Estimated duration must be between 1 and 52 weeks'),
  
  body('maxTeamSize')
    .optional()
    .isInt({ min: 2, max: 20 })
    .withMessage('Maximum team size must be between 2 and 20'),
  
  body('requiredSkills')
    .optional()
    .isArray()
    .withMessage('Required skills must be an array'),
  
  body('requiredSkills.*.name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Skill name must be between 1 and 50 characters'),
  
  body('requiredSkills.*.level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced', 'Expert'])
    .withMessage('Invalid skill level'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Tag must be between 1 and 30 characters'),
  
  handleValidationErrors
];

// Validation rules for project updates
const validateProjectUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Project title must be between 5 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 20, max: 1000 })
    .withMessage('Project description must be between 20 and 1000 characters'),
  
  body('status')
    .optional()
    .isIn(['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'])
    .withMessage('Invalid project status'),
  
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical'])
    .withMessage('Invalid priority level'),
  
  body('progress')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress must be between 0 and 100'),
  
  handleValidationErrors
];

// Validation rules for match requests
const validateMatchRequest = [
  body('recipientId')
    .isMongoId()
    .withMessage('Invalid recipient ID'),
  
  body('projectId')
    .isMongoId()
    .withMessage('Invalid project ID'),
  
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters'),
  
  handleValidationErrors
];

// Validation rules for chat messages
const validateChatMessage = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message content must be between 1 and 1000 characters'),
  
  body('messageType')
    .optional()
    .isIn(['Text', 'File', 'System', 'Notification'])
    .withMessage('Invalid message type'),
  
  body('replyTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid reply message ID'),
  
  handleValidationErrors
];

// Validation rules for file uploads
const validateFileUpload = [
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('File description cannot exceed 500 characters'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Tag must be between 1 and 30 characters'),
  
  body('category')
    .optional()
    .isIn(['Document', 'Image', 'Video', 'Audio', 'Code', 'Data', 'Other'])
    .withMessage('Invalid file category'),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean value'),
  
  handleValidationErrors
];

// Validation rules for MongoDB ObjectId parameters
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  handleValidationErrors
];

// Validation rules for pagination queries
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isString()
    .withMessage('Sort field must be a string'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either "asc" or "desc"'),
  
  handleValidationErrors
];

// Validation rules for search queries
const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  query('category')
    .optional()
    .isString()
    .withMessage('Category must be a string'),
  
  query('institution')
    .optional()
    .isString()
    .withMessage('Institution must be a string'),
  
  query('academicLevel')
    .optional()
    .isIn(['Undergraduate', 'Graduate', 'PhD', 'PostDoc', 'Faculty'])
    .withMessage('Invalid academic level'),
  
  query('availability')
    .optional()
    .isIn(['Available', 'Busy', 'Unavailable', 'Looking for projects'])
    .withMessage('Invalid availability status'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validateProjectCreation,
  validateProjectUpdate,
  validateMatchRequest,
  validateChatMessage,
  validateFileUpload,
  validateObjectId,
  validatePagination,
  validateSearch
};
