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
  private isRefreshingToken = false;

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

    this.socket.on('connect_error', async (error) => {
      console.error('🚫 Socket connection error:', error);

      // Check if this is an authentication error (token expired)
      const isAuthError = error.message === 'Authentication failed';
      console.log('🔍 Is authentication error?', isAuthError);

      // Try to refresh token if authentication failed and not already refreshing
      if (isAuthError && !this.isRefreshingToken) {
        this.isRefreshingToken = true;
        console.log('🔄 Attempting to refresh token for WebSocket...');

        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            console.error('❌ No refresh token found for WebSocket');
            this.isRefreshingToken = false;
            this.onErrorCallback?.('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
            return;
          }

          // Call refresh endpoint directly (avoid using axios instance to prevent infinite loops)
          const response = await fetch('http://localhost:1000/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          });

          if (!response.ok) {
            throw new Error(`Refresh failed: ${response.status}`);
          }

          const data = await response.json();
          const newAccessToken = data.accessToken;

          if (!newAccessToken) {
            throw new Error('No access token in refresh response');
          }

          console.log('✅ WebSocket token refreshed successfully');

          // Update localStorage
          localStorage.setItem('accessToken', newAccessToken);

          // Reset retry attempts since we now have a fresh token
          this.reconnectAttempts = 0;

          // Disconnect current socket and reconnect with new token
          console.log('🔌 Reconnecting WebSocket with new token...');
          this.disconnect();

          // Reconnect with new token (will get it from localStorage)
          const newToken = localStorage.getItem('accessToken');
          if (newToken) {
            this.connect(newToken);
          }

        } catch (refreshErr) {
          console.error('❌ Token refresh failed for WebSocket:', refreshErr);
          this.onErrorCallback?.('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
          // Disconnect permanently since refresh failed
          this.disconnect();
        } finally {
          this.isRefreshingToken = false;
        }
      } else {
        // Regular reconnection attempt for network errors
        this.reconnectAttempts++;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
          this.onErrorCallback?.('Không thể kết nối đến máy chủ chat sau nhiều lần thử');
        }
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
