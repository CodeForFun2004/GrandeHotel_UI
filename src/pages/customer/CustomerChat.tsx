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
  Divider,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Avatar,
  Alert,
} from "@mui/material";
import {
  Send,
  InsertEmoticon,
  Person,
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
  type Conversation,
} from "../../api/chat";
import ProfileSidebar from "./components/ProfileSidebar";
import { DEFAULT_AVATAR } from "./constants/profile.constants";
import { useChat } from "../../hooks/useChat";

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

/* =========================
   Global CSS
   ========================= */
const GlobalFix: React.FC = () => (
  <style>{`
    :root { --grey:#6b7280; --border:#e7dfe4; --split:#f3f4f6; --text:#1f2937; }
    .ph::placeholder { color:#9ca3af; opacity:.9; }
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
  const [lastUpdate, setLastUpdate] = React.useState<Date>(new Date());

  const active = React.useMemo(() => {
    // If we have a full conversation loaded, use that
    if (fullConversation && fullConversation.threadId === activeId) {
      return fullConversation;
    }
    // Otherwise use the basic conversation from the list
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
    handleTyping: handleRealTimeTyping,
    loadMessages,
  } = useChat({ threadId: activeId || undefined, autoConnect: true });

  // composer
  const [text, setText] = React.useState("");
  const [typing, setTyping] = React.useState(false);

  // Auto-scroll refs
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = React.useCallback(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  // Scroll when messages change
  React.useEffect(() => {
    // Use setTimeout to ensure DOM has updated
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [realTimeMessages, scrollToBottom]);

  const loadFullConversation = async (threadId: string) => {
    try {
      const fullConv = await getCustomerConversation(threadId);
      setFullConversation(fullConv);
      // Load messages into the real-time hook (only pass messages array)
      loadMessages({ ...fullConv, messages: fullConv.messages });
    } catch (error) {
      console.error("Failed to load full conversation:", error);
    }
  };

  const selectConversation = (threadId: string) => {
    setActiveId(threadId);
    // Load full conversation with all messages
    loadFullConversation(threadId);
  };

  const sendMessage = () => {
    if (!active || !text.trim()) return;
    // Use real-time messaging
    sendRealTimeMessage(text.trim());
    setText("");
  };

  const openBooking = () => {
    if (!active?.booking?.Reservation_ID) return;
    navigate("/customer/bookings", { state: { q: active.booking.Reservation_ID } });
  };

  // Load customer conversations
  React.useEffect(() => {
    const loadConversations = async () => {
      if (!userId) {
        console.log("No user ID, skipping load. User object:", user);
        setLoading(false);
        return;
      }

      console.log("Loading conversations for user:", userId);
      setLoading(true);
      setError(null);

      try {
        // Get customer's conversations using the new API
        const customerConversations = await getCustomerConversations();
        console.log("Loaded customer conversations:", customerConversations);

        setConversations(customerConversations);

        // Set first conversation as active if available
        if (customerConversations.length > 0) {
          const firstThreadId = customerConversations[0].threadId;
          setActiveId(firstThreadId);
          // Load full conversation for the first one
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
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
        <Typography>Đang tải cuộc trò chuyện...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (conversations.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Chat sx={{ fontSize: 64, color: "#ccc", mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Chưa có cuộc trò chuyện nào
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Khi bạn có đặt phòng, bạn sẽ có thể chat với nhân viên hỗ trợ.
        </Typography>
      </Box>
    );
  }

  return (
    <div className="profile-page" style={{ background: '#fff', minHeight: '100vh' }}>
      <GlobalFix />
      <div style={{ height: 80, background: '#000' }} />

      <div
        style={{
          width: '100%',
          padding: 24,
          display: 'grid',
          gridTemplateColumns: '25% 75%',
          gap: 24,
          boxSizing: 'border-box',
        }}
      >
        <ProfileSidebar avatarUrl={avatarUrl} name={fullName} role={role} />

        <section
          style={{
            background: '#fff',
            border: '1px solid #f1f5f9',
            borderRadius: 16,
            padding: 24,
          }}
        >
          <h3 style={{ marginBottom: 16 }}>Hỗ trợ Khách hàng</h3>
          {!userId && <p>Vui lòng đăng nhập để xem cuộc trò chuyện hỗ trợ.</p>}
          {userId && (
            <>
              {loading && <p>Đang tải cuộc trò chuyện...</p>}
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {!loading && !error && conversations.length === 0 && (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Chat sx={{ fontSize: 64, color: "#ccc", mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Chưa có cuộc trò chuyện nào
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Khi bạn có đặt phòng, bạn sẽ có thể chat với nhân viên hỗ trợ.
                  </Typography>
                </Box>
              )}

              {!loading && !error && conversations.length > 0 && (
                <Box sx={{ height: "calc(100vh - 200px)", display: "flex", flexDirection: "column" }}>
                  {/* Conversation selector */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: "#b8192b" }}>
                      Chọn cuộc trò chuyện
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ overflowX: "auto", pb: 1 }}>
                      {conversations.map((conv) => (
                        <Card
                          key={conv.threadId}
                          sx={{
                            minWidth: 200,
                            cursor: "pointer",
                            border: conv.threadId === activeId ? "2px solid #b8192b" : "1px solid #e0e0e0",
                            backgroundColor: conv.threadId === activeId ? "rgba(184,25,43,0.05)" : "white",
                          }}
                          onClick={() => selectConversation(conv.threadId)}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                              <Chat sx={{ color: "#b8192b" }} />
                              <Box>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {conv.hotel?.Name || `Đặt phòng #${conv.booking?.Reservation_ID?.slice(-6)}`}
                                </Typography>
                                {conv.hotel?.Address && (
                                  <Typography variant="caption" color="text.secondary">
                                    {conv.hotel.Address}
                                  </Typography>
                                )}
                              </Box>
                            </Stack>
                            {conv.booking && (
                              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                                <Chip
                                  size="small"
                                  label={`${conv.booking.CheckIn} - ${conv.booking.CheckOut}`}
                                  variant="outlined"
                                />
                                {statusChip(conv.booking.Status)}
                              </Stack>
                            )}
                            <Typography variant="caption" color="text.secondary">
                              {fmtTimeShort(conv.lastMessageAt)}
                            </Typography>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  </Box>

                  {/* Chat area */}
                  <Card sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    {/* Header */}
                    <CardContent sx={{ pb: 1.5 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Avatar sx={{ bgcolor: "#b8192b" }}>
                            <Support />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight={800}>
                              Hỗ trợ Khách sạn
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                              <Chip size="small" variant="outlined" icon={<Support />} label="Hỗ trợ 24/7" />
                              <Chip
                                size="small"
                                variant="outlined"
                                icon={<Chat />}
                                label={`Cập nhật: ${fmtTimeShort(lastUpdate.toISOString())}`}
                                sx={{ fontSize: '0.7rem' }}
                              />
                              {active?.booking && (
                                <>
                                  <Chip size="small" variant="outlined" icon={<BookOnline />} label={`#${active.booking.Reservation_ID}`} />
                                  {statusChip(active.booking.Status)}
                                </>
                              )}
                            </Stack>
                          </Box>
                        </Stack>

                        {/* Connection Status */}
                        <Chip
                          size="small"
                          icon={isConnected ? <Wifi /> : <WifiOff />}
                          label={connectionStatus === 'connected' ? 'Online' : connectionStatus === 'connecting' ? 'Connecting...' : 'Offline'}
                          color={isConnected ? 'success' : 'error'}
                          variant="outlined"
                        />
                      </Stack>

                      {/* Error Display */}
                      {socketError && (
                        <Alert severity="error" sx={{ mb: 1 }}>
                          {socketError}
                        </Alert>
                      )}
                    </CardContent>

                    <Divider />

                    {/* Messages */}
                    <Box ref={messagesContainerRef} sx={{ flex: 1, overflowY: "auto", p: 2, backgroundColor: "#fafafa" }}>
                      {active ? (
                        <Stack spacing={1.2}>
                          {realTimeMessages.map((m) => {
                            const mine = m.from === "customer";
                            return (
                              <Box key={m.id} sx={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                                <Box
                                  sx={{
                                    maxWidth: "70%",
                                    px: 1.5,
                                    py: 1,
                                    borderRadius: 1.5,
                                    bgcolor: mine ? "rgba(184,25,43,0.10)" : "#fff",
                                    border: mine ? "1px solid rgba(184,25,43,0.25)" : "1px solid rgba(0,0,0,0.08)",
                                  }}
                                >
                                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                                    {m.text}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {fmtTimeShort(m.time)}
                                  </Typography>
                                </Box>
                              </Box>
                            );
                          })}
                          {realTimeTyping && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
                              <Avatar sx={{ width: 24, height: 24 }}>
                                <Support />
                              </Avatar>
                              <Typography variant="caption">Đang trả lời…</Typography>
                            </Box>
                          )}
                        </Stack>
                      ) : null}
                    </Box>

                    {/* Footer composer */}
                    <Box sx={{ p: 1.5 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TextField
                          placeholder="Nhập tin nhắn hỗ trợ…"
                          size="small"
                          fullWidth
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          onFocus={() => setTyping(true)}
                          onBlur={() => setTyping(false)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <IconButton size="small">
                                  <InsertEmoticon />
                                </IconButton>
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton size="small" color="primary" onClick={sendMessage} disabled={!text.trim()}>
                                  <Send />
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Stack>

                      {/* Quick help options */}
                      <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                        <Chip
                          size="small"
                          label="Thời gian check-in/check-out"
                          onClick={() => setText("Cho tôi hỏi về thời gian check-in và check-out của khách sạn?")}
                          variant="outlined"
                        />
                        <Chip
                          size="small"
                          label="Hủy đặt phòng"
                          onClick={() => setText("Tôi muốn hủy đặt phòng, cần làm thế nào?")}
                          variant="outlined"
                        />
                        <Chip
                          size="small"
                          label="Thay đổi đặt phòng"
                          onClick={() => setText("Tôi muốn thay đổi thông tin đặt phòng")}
                          variant="outlined"
                        />
                        <Chip
                          size="small"
                          label="Thông tin hóa đơn"
                          onClick={() => setText("Tôi cần thông tin về hóa đơn và thanh toán")}
                          variant="outlined"
                        />
                      </Stack>

                      {active?.booking?.Reservation_ID && (
                        <Stack direction="row" spacing={1} mt={1} justifyContent="flex-end">
                          <Button
                            variant="contained"
                            startIcon={<BookOnline />}
                            sx={{ backgroundColor: "#b8192b" }}
                            onClick={openBooking}
                          >
                            Xem Đặt phòng
                          </Button>
                        </Stack>
                      )}
                    </Box>
                  </Card>
                </Box>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default CustomerChat;
