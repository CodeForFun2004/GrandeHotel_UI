import io, { Socket } from 'socket.io-client';

export interface Message {
  id: string;
  from: 'staff' | 'customer';
  text: string;
  time: string;
  threadId: string;
}

export interface ConversationUpdate {
  threadId: string;
  unread: number;
  lastMessage: Message;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Event callbacks
  private onNewMessageCallback?: (message: Message) => void;
  private onUserTypingCallback?: (data: { userId: string; email: string; role: string }) => void;
  private onUserStoppedTypingCallback?: (data: { userId: string; email: string; role: string }) => void;
  private onConversationUpdatedCallback?: (data: ConversationUpdate) => void;
  private onErrorCallback?: (message: string) => void;
  private onJoinedConversationCallback?: (data: { threadId: string }) => void;
  private onConnectCallback?: () => void;
  private onDisconnectCallback?: () => void;

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    // Get API URL from environment or default to localhost
    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:1000';

    this.socket = io(serverUrl, {
      auth: {
        token: token // JWT token for authentication
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
      // ⚠️ Lưu ý: pingInterval và pingTimeout thường được cấu hình ở server-side
      // Client-side config này có thể không có hiệu lực nếu server đã set
    });

    this.setupEventListeners();

    return this.socket;
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to chat server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.onConnectCallback?.();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from chat server:', reason);
      this.isConnected = false;
      this.onDisconnectCallback?.();
    });

    this.socket.on('connect_error', (error) => {
      console.error('🚫 Socket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.onErrorCallback?.('Không thể kết nối đến máy chủ chat');
      }
    });

    // Chat events
    this.socket.on('new_message', (messageData: Message) => {
      console.log('📨 New message received:', messageData);
      this.onNewMessageCallback?.(messageData);
    });

    this.socket.on('user_typing', (data) => {
      this.onUserTypingCallback?.(data);
    });

    this.socket.on('user_stopped_typing', (data) => {
      this.onUserStoppedTypingCallback?.(data);
    });

    this.socket.on('conversation_updated', (data: ConversationUpdate) => {
      console.log('🔄 Conversation updated:', data);
      this.onConversationUpdatedCallback?.(data);
    });

    this.socket.on('joined_conversation', (data) => {
      console.log('✅ Joined conversation:', data.threadId);
      this.onJoinedConversationCallback?.(data);
    });

    this.socket.on('error', (error) => {
      console.error('🚫 Socket error:', error);
      this.onErrorCallback?.(error.message || 'Lỗi kết nối');
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Room management
  joinConversation(threadId: string): void {
    if (this.socket && this.isConnected) {
      console.log('🔗 Joining conversation:', threadId);
      this.socket.emit('join_conversation', { threadId });
    } else {
      console.warn('Cannot join conversation: socket not connected');
    }
  }

  leaveConversation(threadId: string): void {
    if (this.socket && this.isConnected) {
      console.log('🔚 Leaving conversation:', threadId);
      this.socket.emit('leave_conversation', { threadId });
    }
  }

  // Message actions
  sendMessage(threadId: string, text: string): void {
    if (this.socket && this.isConnected && text.trim()) {
      console.log('📤 Sending message to:', threadId);
      this.socket.emit('send_message', { threadId, text: text.trim() });
    } else {
      console.warn('Cannot send message: socket not connected or empty text');
    }
  }

  // Typing indicators
  startTyping(threadId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_start', { threadId });
    }
  }

  stopTyping(threadId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing_stop', { threadId });
    }
  }

  // Event subscription methods
  onNewMessage(callback: (message: Message) => void): void {
    this.onNewMessageCallback = callback;
  }

  onUserTyping(callback: (data: { userId: string; email: string; role: string }) => void): void {
    this.onUserTypingCallback = callback;
  }

  onUserStoppedTyping(callback: (data: { userId: string; email: string; role: string }) => void): void {
    this.onUserStoppedTypingCallback = callback;
  }

  onConversationUpdated(callback: (data: ConversationUpdate) => void): void {
    this.onConversationUpdatedCallback = callback;
  }

  onError(callback: (message: string) => void): void {
    this.onErrorCallback = callback;
  }

  onJoinedConversation(callback: (data: { threadId: string }) => void): void {
    this.onJoinedConversationCallback = callback;
  }

  onConnect(callback: () => void): void {
    this.onConnectCallback = callback;
  }

  onDisconnect(callback: () => void): void {
    this.onDisconnectCallback = callback;
  }

  // Remove all event listeners
  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
    this.onNewMessageCallback = undefined;
    this.onUserTypingCallback = undefined;
    this.onUserStoppedTypingCallback = undefined;
    this.onConversationUpdatedCallback = undefined;
    this.onErrorCallback = undefined;
    this.onJoinedConversationCallback = undefined;
    this.onConnectCallback = undefined;
    this.onDisconnectCallback = undefined;
  }

  // Getters
  get isSocketConnected(): boolean {
    return this.isConnected;
  }

  get socketInstance(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export default new SocketService();
