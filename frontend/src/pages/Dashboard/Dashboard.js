import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Users, 
  FolderOpen, 
  Clock, 
  TrendingUp, 
  Target,
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    teamMembers: 0
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch user's projects
        const projectsResponse = await api.get('/api/projects');
        const projects = projectsResponse.data.data || [];
        
        // Calculate stats
        const totalProjects = projects.length;
        const activeProjects = projects.filter(p => p.status === 'Active').length;
        const completedProjects = projects.filter(p => p.status === 'Completed').length;
        const teamMembers = projects.reduce((total, p) => total + (p.teamMembers?.length || 0), 0);
        
        setStats({ totalProjects, activeProjects, completedProjects, teamMembers });
        
        // Get recent projects
        const recent = projects
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, 3);
        setRecentProjects(recent);
        
        // Get upcoming deadlines
        const deadlines = projects
          .filter(p => p.status === 'Active' && p.endDate)
          .map(p => ({
            ...p,
            daysRemaining: Math.ceil((new Date(p.endDate) - new Date()) / (1000 * 60 * 60 * 24))
          }))
          .filter(p => p.daysRemaining > 0 && p.daysRemaining <= 14)
          .sort((a, b) => a.daysRemaining - b.daysRemaining)
          .slice(0, 5);
        
        setUpcomingDeadlines(deadlines);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'text-success-600 bg-success-50 border-success-200';
      case 'Planning': return 'text-warning-600 bg-warning-50 border-warning-200';
      case 'Completed': return 'text-primary-600 bg-primary-50 border-primary-200';
      case 'On Hold': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-danger-600 bg-danger-50 border-danger-200';
      case 'Medium': return 'text-warning-600 bg-warning-50 border-warning-200';
      case 'Low': return 'text-success-600 bg-success-50 border-success-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-primary-100">
          Ready to collaborate on some amazing projects?
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-lg">
                <FolderOpen className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 bg-success-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 bg-warning-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedProjects}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-lg">
                <Users className="h-6 w-6 text-secondary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Team Members</p>
                <p className="text-2xl font-bold text-gray-900">{stats.teamMembers}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              <Link
                to="/projects/create"
                className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Plus className="h-5 w-5 text-primary-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Create New Project</p>
                  <p className="text-xs text-gray-500">Start a new collaboration</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
              </Link>

              <Link
                to="/matching"
                className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="p-2 bg-success-100 rounded-lg">
                  <Target className="h-5 w-5 text-success-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Find Partners</p>
                  <p className="text-xs text-gray-500">Discover collaborators</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
              </Link>

              <Link
                to="/projects"
                className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <div className="p-2 bg-warning-100 rounded-lg">
                  <FolderOpen className="h-5 w-5 text-warning-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Browse Projects</p>
                  <p className="text-xs text-gray-500">Join existing projects</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
              </Link>
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h3>
          </div>
          <div className="card-body">
            {upcomingDeadlines.length > 0 ? (
              <div className="space-y-3">
                {upcomingDeadlines.map((project) => (
                  <div key={project._id} className="flex items-center p-3 rounded-lg border border-gray-200">
                    <div className="p-2 bg-warning-100 rounded-lg">
                      <Clock className="h-5 w-5 text-warning-600" />
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {project.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(project.priority)}`}>
                          {project.priority}
                        </span>
                        <span className="text-xs text-gray-500">
                          {project.daysRemaining} day{project.daysRemaining !== 1 ? 's' : ''} left
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/projects/${project._id}`}
                      className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming deadlines</p>
                <p className="text-sm text-gray-400">You're all caught up!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
            <Link
              to="/projects"
              className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
            >
              View all projects
            </Link>
          </div>
        </div>
        <div className="card-body">
          {recentProjects.length > 0 ? (
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div key={project._id} className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <FolderOpen className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900">{project.title}</h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {project.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {project.teamMembers?.length || 0} members
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(project.startDate).toLocaleDateString()}
                      </span>
                      {project.progress !== undefined && (
                        <span className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          {project.progress}% complete
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/projects/${project._id}`}
                    className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-4">
                Get started by creating your first project or joining an existing one.
              </p>
              <div className="space-x-3">
                <Link
                  to="/projects/create"
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Link>
                <Link
                  to="/projects"
                  className="btn-outline"
                >
                  Browse Projects
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
