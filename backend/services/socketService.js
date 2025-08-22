const Chat = require('../models/Chat');
const Notification = require('../models/Notification');
const Project = require('../models/Project');

// Store connected users and their socket IDs
const connectedUsers = new Map();
const userRooms = new Map();

const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    const user = socket.user;
    
    console.log(`User connected: ${user.firstName} ${user.lastName} (${userId})`);
    
    // Store user connection
    connectedUsers.set(userId, {
      socketId: socket.id,
      user: user,
      connectedAt: new Date()
    });
    
    // Join user to their personal room
    socket.join(`user:${userId}`);
    
    // Emit user online to all connected clients
    socket.broadcast.emit('user:online', {
      userId: userId,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        availability: user.availability
      }
    });

    // Handle user joining a project room
    socket.on('project:join', async (data) => {
      try {
        const { projectId } = data;
        
        if (!projectId) {
          socket.emit('error', { message: 'Project ID is required' });
          return;
        }

        // Verify user is a member of the project
        const project = await Project.findById(projectId);
        if (!project) {
          socket.emit('error', { message: 'Project not found' });
          return;
        }

        const isMember = project.teamMembers.some(member => 
          member.user.toString() === userId && member.status === 'Active'
        );

        if (!isMember && !user.isAdmin) {
          socket.emit('error', { message: 'Access denied to project' });
          return;
        }

        // Join project room
        socket.join(`project:${projectId}`);
        
        // Store user's project membership
        if (!userRooms.has(userId)) {
          userRooms.set(userId, new Set());
        }
        userRooms.get(userId).add(projectId);
        
        console.log(`User ${userId} joined project room: ${projectId}`);
        
        // Notify other project members
        socket.to(`project:${projectId}`).emit('project:member_joined', {
          projectId,
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar
          },
          timestamp: new Date()
        });
        
      } catch (error) {
        console.error('Error joining project room:', error);
        socket.emit('error', { message: 'Failed to join project room' });
      }
    });

    // Handle user leaving a project room
    socket.on('project:leave', async (data) => {
      try {
        const { projectId } = data;
        
        if (!projectId) return;
        
        // Leave project room
        socket.leave(`project:${projectId}`);
        
        // Remove from user's project list
        if (userRooms.has(userId)) {
          userRooms.get(userId).delete(projectId);
        }
        
        console.log(`User ${userId} left project room: ${projectId}`);
        
        // Notify other project members
        socket.to(`project:${projectId}`).emit('project:member_left', {
          projectId,
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName
          },
          timestamp: new Date()
        });
        
      } catch (error) {
        console.error('Error leaving project room:', error);
      }
    });

    // Handle chat messages
    socket.on('chat:message', async (data) => {
      try {
        const { projectId, content, messageType = 'Text', replyTo } = data;
        
        if (!projectId || !content) {
          socket.emit('error', { message: 'Project ID and content are required' });
          return;
        }

        // Verify user is a member of the project
        const project = await Project.findById(projectId);
        if (!project) {
          socket.emit('error', { message: 'Project not found' });
          return;
        }

        const isMember = project.teamMembers.some(member => 
          member.user.toString() === userId && member.status === 'Active'
        );

        if (!isMember && !user.isAdmin) {
          socket.emit('error', { message: 'Access denied to project' });
          return;
        }

        // Find or create chat for the project
        let chat = await Chat.findOne({ project: projectId });
        if (!chat) {
          chat = new Chat({
            project: projectId,
            participants: [{ user: userId }]
          });
        }

        // Add message to chat
        const messageData = {
          sender: userId,
          content,
          messageType,
          replyTo
        };

        await chat.addMessage(messageData);
        
        // Emit message to all users in the project room
        const messageWithUser = {
          ...messageData,
          sender: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar
          },
          timestamp: new Date()
        };

        io.to(`project:${projectId}`).emit('chat:message', {
          projectId,
          message: messageWithUser
        });

        // Create notification for project members (excluding sender)
        const projectMembers = project.teamMembers
          .filter(member => member.user.toString() !== userId && member.status === 'Active')
          .map(member => member.user);

        for (const memberId of projectMembers) {
          await Notification.create({
            recipient: memberId,
            sender: userId,
            type: 'Message Received',
            title: 'New Message',
            message: `${user.firstName} sent a message in ${project.title}`,
            project: projectId,
            priority: 'Low',
            category: 'Social'
          });
        }

        // Emit notification to online users
        projectMembers.forEach(memberId => {
          const memberSocketId = connectedUsers.get(memberId.toString())?.socketId;
          if (memberSocketId) {
            io.to(memberSocketId).emit('notification:new', {
              type: 'Message Received',
              title: 'New Message',
              message: `${user.firstName} sent a message in ${project.title}`,
              projectId
            });
          }
        });
        
      } catch (error) {
        console.error('Error handling chat message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('chat:typing', (data) => {
      const { projectId } = data;
      if (projectId) {
        socket.to(`project:${projectId}`).emit('chat:typing', {
          projectId,
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName
          }
        });
      }
    });

    socket.on('chat:stop_typing', (data) => {
      const { projectId } = data;
      if (projectId) {
        socket.to(`project:${projectId}`).emit('chat:stop_typing', {
          projectId,
          user: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName
          }
        });
      }
    });

    // Handle match requests
    socket.on('match:request', async (data) => {
      try {
        const { recipientId, projectId, message } = data;
        
        // Emit to recipient if they're online
        const recipientSocketId = connectedUsers.get(recipientId)?.socketId;
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('match:request', {
            requester: {
              _id: user._id,
              firstName: user.firstName,
              lastName: user.lastName,
              avatar: user.avatar
            },
            projectId,
            message,
            timestamp: new Date()
          });
        }
        
      } catch (error) {
        console.error('Error handling match request:', error);
      }
    });

    // Handle match responses
    socket.on('match:response', async (data) => {
      try {
        const { matchId, response, message } = data;
        
        // Emit to requester if they're online
        // This would typically involve looking up the match and finding the requester
        // For now, we'll emit to all users in the project room
        
      } catch (error) {
        console.error('Error handling match response:', error);
      }
    });

    // Handle project progress updates
    socket.on('project:progress_update', async (data) => {
      try {
        const { projectId, progress } = data;
        
        // Verify user has permission to update project
        const project = await Project.findById(projectId);
        if (!project) return;

        const isCreator = project.creator.toString() === userId;
        const isMember = project.teamMembers.some(member => 
          member.user.toString() === userId && member.status === 'Active'
        );

        if (!isCreator && !isMember && !user.isAdmin) return;

        // Update project progress
        project.progress = progress;
        await project.save();

        // Emit update to all project members
        io.to(`project:${projectId}`).emit('project:update', {
          projectId,
          updateType: 'progress',
          progress,
          updatedBy: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName
          },
          timestamp: new Date()
        });
        
      } catch (error) {
        console.error('Error handling project progress update:', error);
      }
    });

    // Handle task completion
    socket.on('project:task_complete', async (data) => {
      try {
        const { projectId, taskId } = data;
        
        // Verify user has permission
        const project = await Project.findById(projectId);
        if (!project) return;

        const isMember = project.teamMembers.some(member => 
          member.user.toString() === userId && member.status === 'Active'
        );

        if (!isMember && !user.isAdmin) return;

        // Find and update task
        const task = project.tasks.id(taskId);
        if (task) {
          task.status = 'Completed';
          task.completedAt = new Date();
          await project.save();
          
          // Emit task completion to all project members
          io.to(`project:${projectId}`).emit('project:task_completed', {
            projectId,
            taskId,
            task: {
              _id: task._id,
              title: task.title,
              status: task.status,
              completedAt: task.completedAt
            },
            completedBy: {
              _id: user._id,
              firstName: user.firstName,
              lastName: user.lastName
            },
            timestamp: new Date()
          });
        }
        
      } catch (error) {
        console.error('Error handling task completion:', error);
      }
    });

    // Handle user online status
    socket.on('user:online', () => {
      // Update user's last active time
      user.updateLastActive().catch(console.error);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.firstName} ${user.lastName} (${userId})`);
      
      // Remove user from connected users
      connectedUsers.delete(userId);
      
      // Leave all project rooms
      if (userRooms.has(userId)) {
        const projects = userRooms.get(userId);
        projects.forEach(projectId => {
          socket.leave(`project:${projectId}`);
          
          // Notify other project members
          socket.to(`project:${projectId}`).emit('project:member_left', {
            projectId,
            user: {
              _id: user._id,
              firstName: user.firstName,
              lastName: user.lastName
            },
            timestamp: new Date()
          });
        });
        userRooms.delete(userId);
      }
      
      // Emit user offline to all connected clients
      socket.broadcast.emit('user:offline', {
        userId: userId,
        timestamp: new Date()
      });
    });
  });

  // Helper functions
  const getConnectedUsers = () => {
    return Array.from(connectedUsers.values());
  };

  const getUserSocketId = (userId) => {
    return connectedUsers.get(userId.toString())?.socketId;
  };

  const isUserOnline = (userId) => {
    return connectedUsers.has(userId.toString());
  };

  const emitToUser = (userId, event, data) => {
    const socketId = getUserSocketId(userId);
    if (socketId) {
      io.to(socketId).emit(event, data);
    }
  };

  const emitToProject = (projectId, event, data) => {
    io.to(`project:${projectId}`).emit(event, data);
  };

  return {
    getConnectedUsers,
    getUserSocketId,
    isUserOnline,
    emitToUser,
    emitToProject
  };
};

module.exports = { setupSocketHandlers };
