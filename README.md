# Collab Sphere

A skill-based intelligent student collaboration platform for academic projects that connects students based on skills, interests, and availability.

## 🚀 Features

### 🎯 User Profiles
- Create detailed profiles with skill tags, interests, and past projects
- Show availability status and last active time
- Cross-institution collaboration support

### 🤖 AI-Powered Partner Matching
- Intelligent matching based on skills, interests, and availability
- Quick Match feature for instant compatible partners
- Advanced algorithm for optimal team formation

### 📋 Project Management
- Create and join academic projects
- Built-in task lists, deadlines, and progress tracking
- Team member management and project status updates

### 💬 Collaboration Hub
- Real-time in-app chat for team communication
- File/document sharing within projects
- No personal contact information required

### 🔔 Smart Notifications
- Real-time notifications for matches, messages, and updates
- Partner replacement requests and approvals
- Project deadline reminders

### 🔄 Partner Replacement
- Request replacement partners for inactive team members
- AI-powered suggestions for optimal replacements
- Seamless team transition process

### 👨‍💼 Admin Dashboard
- User and project management
- System analytics and reports
- Content moderation tools

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **bcrypt** for password hashing

### Frontend
- **React** with functional components and hooks
- **Tailwind CSS** for styling
- **Socket.IO client** for real-time features
- **React Router** for navigation
- **Axios** for API calls

## 📁 Project Structure

```
Collab_Sphere/
├── backend/                 # Node.js backend server
│   ├── config/             # Database and server configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Authentication and validation middleware
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── services/          # Business logic services
│   ├── utils/             # Helper functions
│   └── server.js          # Main server file
├── frontend/               # React frontend application
│   ├── public/            # Static assets
│   ├── src/               # Source code
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service functions
│   │   ├── utils/         # Utility functions
│   │   └── App.js         # Main App component
│   └── package.json       # Frontend dependencies
├── package.json            # Root package.json
└── README.md              # This file
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v5 or higher) - [Download here](https://www.mongodb.com/try/download/community)
- **npm** or **yarn** package manager

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Collab_Sphere
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root directory
cd ..
```

### 3. Environment Setup

#### Backend Environment
Create a `.env` file in the `backend/` directory:
```bash
cd backend
cp env.example .env
```

Edit the `.env` file with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/collab_sphere

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRE=7d

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:

**Windows:**
```bash
# Start MongoDB service
net start MongoDB
```

**macOS/Linux:**
```bash
# Start MongoDB service
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### 5. Seed the Database
```bash
cd backend
npm run seed
```

This will create sample users and projects. You can use these credentials to login:
- **Admin:** john.doe@university.edu / Password123
- **Student:** sarah.johnson@college.edu / Password123
- **PhD:** michael.chen@institute.edu / Password123

### 6. Start the Application

#### Option 1: Start Both Servers (Recommended)
From the root directory:
```bash
npm run dev
```

#### Option 2: Start Servers Separately

**Backend Server:**
```bash
cd backend
npm run dev
```

**Frontend Server:**
```bash
cd frontend
npm start
```

### 7. Access the Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health

## 🔧 Development

### Available Scripts

#### Root Directory
```bash
npm run dev          # Start both backend and frontend
npm run backend      # Start only backend server
npm run frontend     # Start only frontend server
npm run install-all  # Install all dependencies
npm run seed         # Seed the database
npm run build        # Build frontend for production
```

#### Backend Directory
```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm run seed         # Seed database with sample data
```

#### Frontend Directory
```bash
npm start            # Start development server
npm run build        # Build for production
npm test             # Run tests
npm run eject        # Eject from Create React App
```

### Database Seeding
The seed script creates:
- 3 sample users (Admin, Student, PhD)
- 2 sample projects
- Associated chat rooms

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - User logout

#### User Management
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin)

#### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/join` - Join project
- `POST /api/projects/:id/leave` - Leave project

#### Matching
- `POST /api/matching/request` - Request partner match
- `POST /api/matching/quick-match` - Quick match request
- `GET /api/matching/suggestions` - Get match suggestions
- `POST /api/matching/respond` - Respond to match request

#### Chat & Collaboration
- `GET /api/chat/:projectId` - Get project chat messages
- `POST /api/chat/:projectId` - Send message
- `POST /api/files/upload` - Upload file
- `GET /api/files/:projectId` - Get project files

## 🌐 Real-time Features

The application uses Socket.IO for real-time communication:

- **Chat Messages** - Instant messaging within projects
- **Typing Indicators** - Show when users are typing
- **Project Updates** - Real-time project status changes
- **Notifications** - Instant notifications for various events
- **User Status** - Online/offline status updates

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt for secure password storage
- **Rate Limiting** - Protection against brute force attacks
- **CORS Configuration** - Controlled cross-origin requests
- **Input Validation** - Comprehensive request validation
- **Role-based Access Control** - Admin and user permissions

## 📱 Responsive Design

The frontend is built with Tailwind CSS and is fully responsive:
- **Mobile-first** approach
- **Progressive Web App** features
- **Cross-browser** compatibility
- **Accessibility** considerations

## 🚀 Deployment

### Backend Deployment
1. Set `NODE_ENV=production` in your environment
2. Update MongoDB connection string for production
3. Set a strong JWT secret
4. Configure CORS for your production domain
5. Use a process manager like PM2

### Frontend Deployment
1. Run `npm run build` in the frontend directory
2. Deploy the `build/` folder to your hosting service
3. Update API base URL in production environment
4. Configure environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

#### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in `.env` file
- Verify MongoDB version compatibility

#### Port Already in Use
- Change port in `.env` file
- Kill processes using the port
- Use different ports for frontend/backend

#### Authentication Issues
- Clear browser localStorage
- Check JWT secret in `.env`
- Verify token expiration settings

#### Real-time Features Not Working
- Check Socket.IO connection
- Verify authentication token
- Check browser console for errors

### Getting Help
- Check the browser console for error messages
- Review server logs in the terminal
- Ensure all dependencies are installed
- Verify environment variables are set correctly

## 📊 Performance

- **Database Indexing** - Optimized MongoDB queries
- **Caching** - Efficient data retrieval
- **Rate Limiting** - Protection against abuse
- **Compression** - Gzip compression for responses
- **Connection Pooling** - Optimized database connections

## 🔮 Future Enhancements

- **AI-powered matching algorithms**
- **Video conferencing integration**
- **Advanced analytics dashboard**
- **Mobile app development**
- **Integration with learning management systems**
- **Advanced project templates**
- **Skill assessment tools**
- **Mentorship programs**

---

**Happy Collaborating! 🎉**

For support or questions, please open an issue in the repository.
