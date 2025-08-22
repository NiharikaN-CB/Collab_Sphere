import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socket';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    socketId: null,
    reconnectAttempts: 0,
  });

  // Connect to socket when user is authenticated
  useEffect(() => {
    if (isAuthenticated && token && user) {
      socketService.connect(token);
      
      // Update connection status
      const updateStatus = () => {
        setConnectionStatus(socketService.getConnectionStatus());
      };
      
      // Listen for connection status changes
      socketService.on('connect', updateStatus);
      socketService.on('disconnect', updateStatus);
      socketService.on('reconnect', updateStatus);
      
      // Initial status update
      updateStatus();
      
      // Cleanup function
      return () => {
        socketService.off('connect', updateStatus);
        socketService.off('disconnect', updateStatus);
        socketService.off('reconnect', updateStatus);
      };
    } else if (!isAuthenticated) {
      // Disconnect socket when user is not authenticated
      socketService.disconnect();
      setConnectionStatus({
        isConnected: false,
        socketId: null,
        reconnectAttempts: 0,
      });
    }
  }, [isAuthenticated, token, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      socketService.disconnect();
    };
  }, []);

  // Context value
  const value = {
    socket: socketService,
    connectionStatus,
    isConnected: connectionStatus.isConnected,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
