import { useState, useEffect, useCallback, useRef } from 'react';
import socketService, { type Message } from '../services/socketService';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';

export interface Conversation {
  threadId: string;
  customer?: {
    Account_ID: string;
    FirstName: string;
    LastName: string;
    Email: string;
    PhoneNumber: string;
    Status: string;
  };
  hotel?: {
    Hotel_ID: string;
    Name: string;
    Address: string;
  };
  lastMessageAt: string;
  unread: number;
  pinned: boolean;
  booking?: {
    Reservation_ID: string;
    Status: string;
    CheckIn: string;
    CheckOut: string;
  };
  messages: Message[];
}

interface UseChatOptions {
  threadId?: string;
  autoConnect?: boolean;
}

export const useChat = (options: UseChatOptions = {}) => {
  const { threadId, autoConnect = true } = options;
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.accessToken);

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  // Refs
  const typingTimeoutRef = useRef<number>();
  const currentThreadIdRef = useRef<string | undefined>(threadId);

  // Update thread ID ref when it changes
  useEffect(() => {
    currentThreadIdRef.current = threadId;
  }, [threadId]);

  // Socket event handlers
  const handleNewMessage = useCallback((messageData: Message) => {
    // Only handle messages for the current thread
    if (messageData.threadId === currentThreadIdRef.current) {
      setMessages(prev => {
        // Check if message already exists (prevent duplicates)
        const exists = prev.some(msg => msg.id === messageData.id);
        if (exists) return prev;

        return [...prev, messageData];
      });
    }
  }, []);

  const handleUserTyping = useCallback((data: { userId: string; email: string; role: string }) => {
    if (currentThreadIdRef.current) {
      setIsTyping(true);
    }
  }, []);

  const handleUserStoppedTyping = useCallback((data: { userId: string; email: string; role: string }) => {
    if (currentThreadIdRef.current) {
      setIsTyping(false);
    }
  }, []);

  const handleError = useCallback((message: string) => {
    setError(message);
    setConnectionStatus('disconnected');
  }, []);

  const handleConnect = useCallback(() => {
    setIsConnected(true);
    setConnectionStatus('connected');
    setError(null);
  }, []);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  // Connect to socket when component mounts and token is available
  useEffect(() => {
    if (token && autoConnect) {
      console.log('🔌 Connecting to chat server...');
      setConnectionStatus('connecting');

      socketService.connect(token);

      // Set up event listeners
      socketService.onNewMessage(handleNewMessage);
      socketService.onUserTyping(handleUserTyping);
      socketService.onUserStoppedTyping(handleUserStoppedTyping);
      socketService.onError(handleError);
      socketService.onConnect(handleConnect);
      socketService.onDisconnect(handleDisconnect);

      // Cleanup function
      return () => {
        console.log('🔌 Cleaning up socket listeners...');
        socketService.removeAllListeners();
      };
    }
  }, [token, autoConnect, handleNewMessage, handleUserTyping, handleUserStoppedTyping, handleError, handleConnect, handleDisconnect]);

  // Join/leave conversation rooms when threadId changes
  useEffect(() => {
    if (threadId && isConnected) {
      console.log('🏠 Joining conversation room:', threadId);
      socketService.joinConversation(threadId);

      // Leave previous room if threadId changed
      return () => {
        if (currentThreadIdRef.current && currentThreadIdRef.current !== threadId) {
          console.log('🏠 Leaving conversation room:', currentThreadIdRef.current);
          socketService.leaveConversation(currentThreadIdRef.current);
        }
      };
    }
  }, [threadId, isConnected]);

  // Send message via socket
  const sendMessage = useCallback((text: string) => {
    if (threadId && text.trim() && isConnected) {
      socketService.sendMessage(threadId, text.trim());
      // Clear typing indicator when sending
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    } else {
      console.warn('Cannot send message: no threadId, empty text, or not connected');
    }
  }, [threadId, isConnected]);

  // Handle typing with debouncing
  const handleTyping = useCallback(() => {
    if (threadId && isConnected) {
      socketService.startTyping(threadId);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        socketService.stopTyping(threadId);
      }, 1000);
    }
  }, [threadId, isConnected]);

  // Load initial messages (from your existing API)
  const loadMessages = useCallback(async (conversation?: Conversation) => {
    if (conversation) {
      setMessages(conversation.messages || []);
    }
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Disconnect socket
  const disconnect = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    messages,
    isTyping,
    isConnected,
    connectionStatus,
    error,

    // Actions
    sendMessage,
    handleTyping,
    loadMessages,
    clearMessages,
    disconnect,

    // Socket info
    socketService,
  };
};
