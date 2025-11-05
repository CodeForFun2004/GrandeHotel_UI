import React from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Button,
  Avatar,
  Alert,
} from "@mui/material";
import {
  Send,
  BookOnline,
  Support,
  Chat,
  Wifi,
  WifiOff,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import {
  getCustomerConversations,
  getCustomerConversation,
  sendCustomerMessage,
} from "../../api/chat";
import ProfileSidebar from "./components/ProfileSidebar";
import { DEFAULT_AVATAR } from "./constants/profile.constants";
import { useChat, type Conversation } from "../../hooks/useChat";

/* =========================
   Helpers
   ========================= */
const fmtTimeShort = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const statusChip = (s: string) =>
  s === "confirmed" ? (
    <Chip size="small" color="success" label="Confirmed" />
  ) : s === "pending" ? (
    <Chip size="small" color="warning" label="Pending" />
  ) : (
    <Chip size="small" color="error" label="Cancelled" />
  );

const fullName = (c: Conversation['customer']) => c ? `${c.FirstName} ${c.LastName}`.trim() : 'Khách sạn';

const GlobalFix: React.FC = () => (
  <style>{`
    :root { 
      --grey: #6b7280; 
      --border: #e7dfe4; 
      --split: #f3f4f6; 
      --text: #1f2937;
      --primary: #3b82f6;
    }
    .chat-container {
      display: flex;
      height: calc(100vh - 200px);
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #f1f5f9;
    }
    .conversation-list {
      width: 300px;
      background: white;
      border-right: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
    }
    .conversation-header {
      padding: 16px;
      border-bottom: 1px solid #f1f5f9;
      background: #f8fafc;
    }
    .conversation-item {
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .conversation-item:hover {
      background: #f8fafc;
    }
    .conversation-item.active {
      background: #eff6ff;
      border-left: 3px solid var(--primary);
    }
    .chat-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: white;
    }
    .chat-header {
      padding: 16px 20px;
      border-bottom: 1px solid #f1f5f9;
      background: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background: #f8fafc;
    }
    .message {
      margin-bottom: 16px;
      display: flex;
    }
    .message.sent {
      justify-content: flex-end;
    }
    .message.received {
      justify-content: flex-start;
    }
    .message-bubble {
      max-width: 70%;
      padding: 8px 12px;
      border-radius: 18px;
      font-size: 14px;
      line-height: 1.4;
    }
    .message.sent .message-bubble {
      background: var(--primary);
      color: white;
      border-bottom-right-radius: 4px;
    }
    .message.received .message-bubble {
      background: white;
      color: var(--text);
      border: 1px solid #e5e7eb;
      border-bottom-left-radius: 4px;
    }
    .message-time {
      font-size: 11px;
      opacity: 0.7;
      margin-top: 4px;
      text-align: right;
    }
    .chat-input-container {
      padding: 16px 20px;
      border-top: 1px solid #f1f5f9;
      background: white;
    }
    .chat-input {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .chat-input .MuiOutlinedInput-root {
      border-radius: 20px;
    }
    .ph::placeholder { 
      color: #9ca3af; 
      opacity: .9; 
    }
  `}</style>
);

/* =========================
   Component
   ========================= */
const CustomerChat: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const userId = React.useMemo(() => (user as any)?._id ?? (user as any)?.id ?? '', [user]);
  const avatarUrl = (user as any)?.avatar?.trim?.() || DEFAULT_AVATAR;
  const fullName = (user as any)?.fullname || (user as any)?.username || 'Your name';
  const role = (user as any)?.role || 'customer';
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [fullConversation, setFullConversation] = React.useState<Conversation | null>(null);

  const active = React.useMemo(() => {
    if (fullConversation && fullConversation.threadId === activeId) {
      return fullConversation;
    }
    return conversations.find((t) => t.threadId === activeId) || null;
  }, [conversations, activeId, fullConversation]);

  // Real-time chat hook
  const {
    messages: realTimeMessages,
    isTyping: realTimeTyping,
    isConnected,
    connectionStatus,
    error: socketError,
    sendMessage: sendRealTimeMessage,
    loadMessages,
  } = useChat({ threadId: activeId || undefined, autoConnect: true });

  const [text, setText] = React.useState("");
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = React.useCallback(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [realTimeMessages, scrollToBottom]);

  const loadFullConversation = async (threadId: string) => {
    try {
      const fullConv = await getCustomerConversation(threadId);
      setFullConversation(fullConv);
      // Convert messages to the expected format for socket service
      const messages = fullConv.messages?.map(msg => ({
        id: msg.id,
        text: msg.text,
        time: msg.time,
        from: msg.from,
        threadId: fullConv.threadId
      })) || [];
      // Load messages directly using the hook's internal state setter
      loadMessages({ ...fullConv, messages });
    } catch (error) {
      console.error("Failed to load full conversation:", error);
    }
  };

  const selectConversation = (threadId: string) => {
    setActiveId(threadId);
    loadFullConversation(threadId);
  };

  const sendMessage = () => {
    if (!active || !text.trim()) return;
    sendRealTimeMessage(text.trim());
    setText("");
  };

  const openBooking = () => {
    if (!active?.booking?.Reservation_ID) return;
    navigate("/customer/bookings", { state: { q: active.booking.Reservation_ID } });
  };

  React.useEffect(() => {
    const loadConversations = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const customerConversations = await getCustomerConversations();
        setConversations(customerConversations);

        if (customerConversations.length > 0) {
          const firstThreadId = customerConversations[0].threadId;
          setActiveId(firstThreadId);
          loadFullConversation(firstThreadId);
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
        setError("Không thể tải cuộc trò chuyện. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [userId, user]);

  if (loading) {
    return (
      <div className="profile-page" style={{ background: '#fff', minHeight: '100vh' }}>
        <GlobalFix />
        <div style={{ height: 80, background: '#000' }} />
        <div style={{
          width: '100%',
          padding: 24,
          display: 'grid',
          gridTemplateColumns: '25% 75%',
          gap: 24,
          boxSizing: 'border-box',
        }}>
          <ProfileSidebar avatarUrl={avatarUrl} name={fullName} role={role} />
          <Box sx={{ 
            background: '#fff', 
            border: '1px solid #f1f5f9', 
            borderRadius: 16, 
            p: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Typography>Đang tải cuộc trò chuyện...</Typography>
          </Box>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page" style={{ background: '#fff', minHeight: '100vh' }}>
        <GlobalFix />
        <div style={{ height: 80, background: '#000' }} />
        <div style={{
          width: '100%',
          padding: 24,
          display: 'grid',
          gridTemplateColumns: '25% 75%',
          gap: 24,
          boxSizing: 'border-box',
        }}>
          <ProfileSidebar avatarUrl={avatarUrl} name={fullName} role={role} />
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="profile-page" style={{ background: '#fff', minHeight: '100vh' }}>
        <GlobalFix />
        <div style={{ height: 80, background: '#000' }} />
        <div style={{
          width: '100%',
          padding: 24,
          display: 'grid',
          gridTemplateColumns: '25% 75%',
          gap: 24,
          boxSizing: 'border-box',
        }}>
          <ProfileSidebar avatarUrl={avatarUrl} name={fullName} role={role} />
          <Box sx={{ 
            background: '#fff', 
            border: '1px solid #f1f5f9', 
            borderRadius: 16, 
            p: 24,
            textAlign: 'center'
          }}>
            <Chat sx={{ fontSize: 64, color: "#ccc", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Chưa có cuộc trò chuyện nào
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Khi bạn có đặt phòng, bạn sẽ có thể chat với nhân viên hỗ trợ.
            </Typography>
          </Box>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page" style={{ background: '#fff', minHeight: '100vh' }}>
      <GlobalFix />
      <div style={{ height: 80, background: '#000' }} />

      <div style={{
        width: '100%',
        padding: 24,
        display: 'grid',
        gridTemplateColumns: '25% 75%',
        gap: 24,
        boxSizing: 'border-box',
      }}>
        <ProfileSidebar avatarUrl={avatarUrl} name={fullName} role={role} />

        <section style={{
          background: '#fff',
          border: '1px solid #f1f5f9',
          borderRadius: 16,
          padding: 0,
          overflow: 'hidden',
        }}>
          <h3 style={{ margin: 0, padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
            Hỗ trợ Khách hàng
          </h3>

          {!userId && (
            <Box sx={{ p: 24 }}>
              <Typography>Vui lòng đăng nhập để xem cuộc trò chuyện hỗ trợ.</Typography>
            </Box>
          )}

          {userId && (
            <div className="chat-container">
              {/* Conversations List */}
              <div className="conversation-list">
                <div className="conversation-header">
                  <Typography variant="h6" fontSize="16px" fontWeight={600}>
                    Cuộc trò chuyện
                  </Typography>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {conversations.map((conv) => (
                    <div
                      key={conv.threadId}
                      className={`conversation-item ${conv.threadId === activeId ? 'active' : ''}`}
                      onClick={() => selectConversation(conv.threadId)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar sx={{ width: 40, height: 40, bgcolor: '#3b82f6' }}>
                          <Chat sx={{ fontSize: 18 }} />
                        </Avatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" fontWeight={600} noWrap>
                            {conv.hotel?.Name || `Đặt phòng #${conv.booking?.Reservation_ID?.slice(-6)}`}
                          </Typography>
                          {conv.hotel?.Address && (
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {conv.hotel.Address}
                            </Typography>
                          )}
                          {conv.booking && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                              <Chip
                                size="small"
                                label={`${conv.booking.CheckIn} - ${conv.booking.CheckOut}`}
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                              {statusChip(conv.booking.Status)}
                            </div>
                          )}
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11px' }}>
                            {fmtTimeShort(conv.lastMessageAt)}
                          </Typography>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Area */}
              <div className="chat-area">
                {active ? (
                  <>
                    {/* Chat Header */}
                    <div className="chat-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar sx={{ width: 40, height: 40, bgcolor: '#3b82f6' }}>
                          <Support sx={{ fontSize: 20 }} />
                        </Avatar>
                        <div>
                          <Typography variant="subtitle1" fontWeight={600}>
                            Hỗ trợ Khách sạn
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {isConnected ? (
                              <span style={{ color: '#10b981' }}>● Online</span>
                            ) : (
                              <span style={{ color: '#ef4444' }}>● Offline</span>
                            )}
                          </Typography>
                        </div>
                      </div>
                      {active?.booking?.Reservation_ID && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<BookOnline />}
                          onClick={openBooking}
                        >
                          Xem Đặt phòng
                        </Button>
                      )}
                    </div>

                    {/* Messages */}
                    <div className="chat-messages" ref={messagesContainerRef}>
                      {realTimeMessages.map((m) => {
                        const mine = m.from === "customer";
                        return (
                          <div key={m.id} className={`message ${mine ? 'sent' : 'received'}`}>
                            <div className="message-bubble">
                              <Typography variant="body2">{m.text}</Typography>
                              <div className="message-time">
                                {fmtTimeShort(m.time)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {realTimeTyping && (
                        <div className="message received">
                          <div className="message-bubble">
                            <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.7 }}>
                              Đang trả lời...
                            </Typography>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Chat Input */}
                    <div className="chat-input-container">
                      <div className="chat-input">
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Nhập tin nhắn..."
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          className="ph"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: '#e5e7eb',
                              },
                              '&:hover fieldset': {
                                borderColor: '#3b82f6',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#3b82f6',
                              },
                            },
                          }}
                        />
                        <IconButton
                          onClick={sendMessage}
                          disabled={!text.trim()}
                          sx={{
                            bgcolor: text.trim() ? '#3b82f6' : '#e5e7eb',
                            color: text.trim() ? 'white' : '#9ca3af',
                            '&:hover': {
                              bgcolor: text.trim() ? '#2563eb' : '#e5e7eb',
                            },
                          }}
                        >
                          <Send />
                        </IconButton>
                      </div>
                    </div>
                  </>
                ) : (
                  <Box sx={{ 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 2
                  }}>
                    <Chat sx={{ fontSize: 64, color: "#ccc" }} />
                    <Typography variant="h6" color="text.secondary">
                      Chọn một cuộc trò chuyện
                    </Typography>
                  </Box>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CustomerChat;
