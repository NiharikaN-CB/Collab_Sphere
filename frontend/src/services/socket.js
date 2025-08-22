import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
  }

  // Initialize socket connection
  connect(token) {
    if (this.socket && this.isConnected) {
      return;
    }

    try {
      this.socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Socket connection failed:', error);
    }
  }

  // Setup socket event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      
      // Emit user online event
      this.socket.emit('user:online');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        this.socket.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
      
      if (error.message === 'Authentication error') {
        // Token is invalid, clear it and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Re-join rooms and emit user online
      this.socket.emit('user:online');
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Socket reconnection attempt:', attemptNumber);
      this.reconnectAttempts = attemptNumber;
      
      if (attemptNumber >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
      this.isConnected = false;
    });

    // Chat events
    this.socket.on('chat:message', (data) => {
      this.emitEvent('chat:message', data);
    });

    this.socket.on('chat:typing', (data) => {
      this.emitEvent('chat:typing', data);
    });

    this.socket.on('chat:stop_typing', (data) => {
      this.emitEvent('chat:stop_typing', data);
    });

    // Project events
    this.socket.on('project:update', (data) => {
      this.emitEvent('project:update', data);
    });

    this.socket.on('project:member_joined', (data) => {
      this.emitEvent('project:member_joined', data);
    });

    this.socket.on('project:member_left', (data) => {
      this.emitEvent('project:member_left', data);
    });

    this.socket.on('project:task_completed', (data) => {
      this.emitEvent('project:task_completed', data);
    });

    // Notification events
    this.socket.on('notification:new', (data) => {
      this.emitEvent('notification:new', data);
    });

    this.socket.on('notification:read', (data) => {
      this.emitEvent('notification:read', data);
    });

    // Match events
    this.socket.on('match:request', (data) => {
      this.emitEvent('match:request', data);
    });

    this.socket.on('match:response', (data) => {
      this.emitEvent('match:response', data);
    });

    // File events
    this.socket.on('file:uploaded', (data) => {
      this.emitEvent('file:uploaded', data);
    });

    this.socket.on('file:deleted', (data) => {
      this.emitEvent('file:deleted', data);
    });
  }

  // Join a project room
  joinProject(projectId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('project:join', { projectId });
      console.log('Joined project room:', projectId);
    }
  }

  // Leave a project room
  leaveProject(projectId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('project:leave', { projectId });
      console.log('Left project room:', projectId);
    }
  }

  // Send a chat message
  sendMessage(projectId, message) {
    if (this.socket && this.isConnected) {
      this.socket.emit('chat:message', {
        projectId,
        content: message.content,
        messageType: message.messageType || 'Text',
        replyTo: message.replyTo,
      });
    }
  }

  // Send typing indicator
  sendTyping(projectId, isTyping) {
    if (this.socket && this.isConnected) {
      if (isTyping) {
        this.socket.emit('chat:typing', { projectId });
      } else {
        this.socket.emit('chat:stop_typing', { projectId });
      }
    }
  }

  // Request a match
  requestMatch(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('match:request', data);
    }
  }

  // Respond to a match request
  respondToMatch(matchId, response, message = '') {
    if (this.socket && this.isConnected) {
      this.socket.emit('match:response', {
        matchId,
        response, // 'accept' or 'reject'
        message,
      });
    }
  }

  // Update project progress
  updateProjectProgress(projectId, progress) {
    if (this.socket && this.isConnected) {
      this.socket.emit('project:progress_update', {
        projectId,
        progress,
      });
    }
  }

  // Complete a task
  completeTask(projectId, taskId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('project:task_complete', {
        projectId,
        taskId,
      });
    }
  }

  // Add event listener
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Emit event to all listeners
  emitEvent(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventListeners.clear();
    }
  }

  // Reconnect socket
  reconnect() {
    if (this.socket) {
      this.socket.connect();
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
