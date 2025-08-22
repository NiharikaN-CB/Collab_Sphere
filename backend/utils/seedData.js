const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Project = require('../models/Project');
const Chat = require('../models/Chat');

// Sample users data
const sampleUsers = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@university.edu',
    password: 'Password123',
    institution: 'University of Technology',
    fieldOfStudy: 'Computer Science',
    academicLevel: 'Graduate',
    skills: [
      { name: 'JavaScript', level: 'Advanced', category: 'Programming' },
      { name: 'React', level: 'Advanced', category: 'Programming' },
      { name: 'Node.js', level: 'Intermediate', category: 'Programming' },
      { name: 'UI/UX Design', level: 'Intermediate', category: 'Design' }
    ],
    interests: ['Web Development', 'Machine Learning', 'Open Source'],
    availability: 'Available',
    maxProjects: 3,
    isAdmin: true
  },
  {
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@college.edu',
    password: 'Password123',
    institution: 'State College',
    fieldOfStudy: 'Data Science',
    academicLevel: 'Undergraduate',
    skills: [
      { name: 'Python', level: 'Advanced', category: 'Programming' },
      { name: 'Machine Learning', level: 'Intermediate', category: 'Analysis' },
      { name: 'Statistics', level: 'Advanced', category: 'Analysis' },
      { name: 'SQL', level: 'Intermediate', category: 'Programming' }
    ],
    interests: ['Data Analysis', 'AI Research', 'Statistics'],
    availability: 'Looking for projects',
    maxProjects: 2
  },
  {
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@institute.edu',
    password: 'Password123',
    institution: 'Tech Institute',
    fieldOfStudy: 'Software Engineering',
    academicLevel: 'PhD',
    skills: [
      { name: 'Java', level: 'Expert', category: 'Programming' },
      { name: 'System Design', level: 'Expert', category: 'Programming' },
      { name: 'Database Design', level: 'Advanced', category: 'Programming' },
      { name: 'Agile Development', level: 'Advanced', category: 'Management' }
    ],
    interests: ['Software Architecture', 'Distributed Systems', 'Research'],
    availability: 'Available',
    maxProjects: 4
  }
];

// Sample projects data
const sampleProjects = [
  {
    title: 'AI-Powered Student Collaboration Platform',
    description: 'Developing an intelligent platform that matches students based on skills, interests, and availability for academic collaboration. The platform will use machine learning algorithms to suggest optimal team formations and track project progress.',
    category: 'Software Development',
    institution: 'University of Technology',
    fieldOfStudy: 'Computer Science',
    academicLevel: 'Graduate',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-06-15'),
    estimatedDuration: 20,
    maxTeamSize: 6,
    requiredSkills: [
      { name: 'React', level: 'Intermediate', isRequired: true },
      { name: 'Node.js', level: 'Intermediate', isRequired: true },
      { name: 'Machine Learning', level: 'Beginner', isRequired: false },
      { name: 'UI/UX Design', level: 'Beginner', isRequired: false }
    ],
    tags: ['AI', 'Collaboration', 'Web Development', 'Machine Learning'],
    isOpenToJoin: true,
    allowCrossInstitution: true
  },
  {
    title: 'Climate Change Impact Analysis in Urban Areas',
    description: 'Research project analyzing the effects of climate change on urban infrastructure and population. The study will use satellite data, climate models, and statistical analysis to predict future impacts and suggest adaptation strategies.',
    category: 'Research',
    institution: 'State College',
    fieldOfStudy: 'Environmental Science',
    academicLevel: 'Undergraduate',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-08-01'),
    estimatedDuration: 24,
    maxTeamSize: 4,
    requiredSkills: [
      { name: 'Python', level: 'Intermediate', isRequired: true },
      { name: 'Statistics', level: 'Intermediate', isRequired: true },
      { name: 'GIS', level: 'Beginner', isRequired: false },
      { name: 'Climate Science', level: 'Beginner', isRequired: false }
    ],
    tags: ['Climate Change', 'Urban Planning', 'Data Analysis', 'Research'],
    isOpenToJoin: true,
    allowCrossInstitution: true
  }
];

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/collab_sphere', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearData = async () => {
  try {
    await User.deleteMany({});
    await Project.deleteMany({});
    await Chat.deleteMany({});
    console.log('🗑️  Cleared existing data');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  }
};

// Seed users
const seedUsers = async () => {
  try {
    const createdUsers = [];
    
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`👤 Created user: ${user.firstName} ${user.lastName}`);
    }
    
    return createdUsers;
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
};

// Seed projects
const seedProjects = async (users) => {
  try {
    const createdProjects = [];
    
    for (let i = 0; i < sampleProjects.length; i++) {
      const projectData = sampleProjects[i];
      const creator = users[i % users.length]; // Distribute projects among users
      
      const project = new Project({
        ...projectData,
        creator: creator._id,
        teamMembers: [{
          user: creator._id,
          role: 'Leader',
          joinedAt: new Date(),
          status: 'Active'
        }]
      });
      
      await project.save();
      createdProjects.push(project);
      console.log(`📋 Created project: ${project.title}`);
      
      // Create chat for the project
      const chat = new Chat({
        project: project._id,
        participants: [{
          user: creator._id,
          joinedAt: new Date(),
          lastSeen: new Date()
        }]
      });
      
      await chat.save();
      console.log(`💬 Created chat for project: ${project.title}`);
      
      // Add project to user's past projects
      creator.pastProjects.push({
        projectId: project._id,
        role: 'Leader',
        completionDate: null
      });
      await creator.save();
    }
    
    return createdProjects;
  } catch (error) {
    console.error('❌ Error seeding projects:', error);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    await clearData();
    
    // Seed users
    console.log('\n👥 Seeding users...');
    const users = await seedUsers();
    
    // Seed projects
    console.log('\n📋 Seeding projects...');
    await seedProjects(users);
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Users created: ${users.length}`);
    console.log(`   - Projects created: ${sampleProjects.length}`);
    console.log(`   - Chats created: ${sampleProjects.length}`);
    
    // Display sample login credentials
    console.log('\n🔑 Sample login credentials:');
    sampleUsers.forEach(user => {
      console.log(`   Email: ${user.email} | Password: ${user.password}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
