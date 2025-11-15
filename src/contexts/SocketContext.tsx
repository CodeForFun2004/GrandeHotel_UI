import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';
import socketService, { type Message } from '../services/socketService';

interface SocketContextType {
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  // Event subscriptions
  onNewMessage: (callback: (message: Message) => void) => () => void;
  onUserTyping: (callback: (data: { userId: string; email: string; role: string }) => void) => () => void;
  onUserStoppedTyping: (callback: (data: { userId: string; email: string; role: string }) => void) => () => void;
  onError: (callback: (message: string) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  const token = useSelector((state: RootState) => state.auth.accessToken);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (token && user) {
      console.log('🔌 Establishing persistent socket connection...');
      setConnectionStatus('connecting');

      socketService.connect(token);

      // Set up persistent listeners
      socketService.onConnect(() => {
        setIsConnected(true);
        setConnectionStatus('connected');
        console.log('🔌 Persistent socket connected');
      });

      socketService.onDisconnect(() => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        console.log('🔌 Persistent socket disconnected');
      });

      socketService.onError((error) => {
        console.error('🔌 Persistent socket error:', error);
        setConnectionStatus('disconnected');
      });
    }

    // Only disconnect on app unmount or when no token (logout)
    return () => {
      if (!token) {
        console.log('🔌 Disconnecting persistent socket (logout/app close)');
        socketService.disconnect();
      }
    };
  }, [token, user]);

  // Event subscription methods
  const onNewMessage = (callback: (message: Message) => void) => {
    socketService.onNewMessage(callback);
    return () => socketService.onNewMessage(() => {}); // Return unsubscribe function
  };

  const onUserTyping = (callback: (data: { userId: string; email: string; role: string }) => void) => {
    socketService.onUserTyping(callback);
    return () => socketService.onUserTyping(() => {});
  };

  const onUserStoppedTyping = (callback: (data: { userId: string; email: string; role: string }) => void) => {
    socketService.onUserStoppedTyping(callback);
    return () => socketService.onUserStoppedTyping(() => {});
  };

  const onError = (callback: (message: string) => void) => {
    socketService.onError(callback);
    return () => socketService.onError(() => {});
  };

  return (
    <SocketContext.Provider value={{
      isConnected,
      connectionStatus,
      onNewMessage,
      onUserTyping,
      onUserStoppedTyping,
      onError
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};
