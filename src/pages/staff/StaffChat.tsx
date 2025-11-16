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
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Chip,
  Badge,
  Divider,
  Button,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  Tooltip,
  Alert,
} from "@mui/material";
import {
  Search,
  Send,
  AttachFile,
  InsertEmoticon,
  MoreVert,
  CheckCircle,
  AccessTime,
  Cancel,
  Person,
  Phone,
  Email,
  History,
  BookOnline,
  Wifi,
  WifiOff,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import {
  getStaffConversations,
  getStaffConversation,
  sendStaffMessage,
  markStaffRead,
  toggleStaffPin,
  type Conversation,
} from "../../api/chat";
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
    <Chip size="small" color="success" icon={<CheckCircle fontSize="small" />} label="Confirmed" />
  ) : s === "pending" ? (
    <Chip size="small" color="warning" icon={<AccessTime fontSize="small" />} label="Pending" />
  ) : (
    <Chip size="small" color="error" icon={<Cancel fontSize="small" />} label="Cancelled" />
  );

const fullName = (c: Conversation['customer']) => c ? `${c.FirstName} ${c.LastName}`.trim() : '';

/* =========================
   Component
   ========================= */
const StaffChat: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [query, setQuery] = React.useState("");
  const [tab, setTab] = React.useState<"all" | "unread" | "active">("all");
  const [threads, setThreads] = React.useState<Conversation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [lastUpdate, setLastUpdate] = React.useState<Date>(new Date());

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const active = React.useMemo(() => threads.find((t) => t.threadId === activeId) || null, [threads, activeId]);

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

  // search + filter
  const filtered = React.useMemo(() => {
    const kw = query.trim().toLowerCase();
    return threads
      .filter((t) => {
        const matchKw =
          !kw ||
          fullName(t.customer).toLowerCase().includes(kw) ||
          (t.customer?.PhoneNumber && t.customer.PhoneNumber.includes(kw)) ||
          t.booking?.Reservation_ID?.toLowerCase().includes(kw);
        const matchTab =
          tab === "all" ? true : tab === "unread" ? t.unread > 0 : (t.booking?.Status || "pending") === "confirmed";
        return matchKw && matchTab;
      })
      .sort((a, b) => +new Date(b.lastMessageAt) - +new Date(a.lastMessageAt));
  }, [threads, query, tab]);

  // menu more
  const [anchor, setAnchor] = React.useState<null | HTMLElement>(null);

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

  const sendMessage = () => {
    if (!active || !text.trim()) return;
    // Use real-time messaging
    sendRealTimeMessage(text.trim());
    setText("");
  };

  const markAllRead = async (threadId: string) => {
    try {
      await markStaffRead(threadId);
      setThreads((prev) => prev.map((t) => (t.threadId === threadId ? { ...t, unread: 0 } : t)));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const quickReply = (tpl: string) => setText((s) => (s ? s + " " + tpl : tpl));

  const openCustomer = () => {
    if (!active) return;
    navigate("/staff/customers", { state: { q: active.customer?.PhoneNumber || "" } });
  };

  const openBooking = () => {
    if (!active?.booking?.Reservation_ID) return;
    navigate("/staff/bookings", { state: { q: active.booking.Reservation_ID } });
  };

  // Fetch conversations on mount and when query/tab changes
  React.useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const data = await getStaffConversations({ hotelId: user?.hotelId as string, query, tab });
        setThreads(data);
        if (data.length > 0 && !activeId) {
          setActiveId(data[0].threadId);
        }
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, [query, tab]);

  // Fetch full messages when selecting a thread and load into real-time hook
  React.useEffect(() => {
    if (!activeId) return;
    const fetchConversation = async () => {
      try {
        const data = await getStaffConversation(activeId);
        // Load messages into the real-time hook (only pass messages array)
        loadMessages({ ...data, messages: data.messages });
        // Mark as read
        await markAllRead(activeId);
      } catch (error) {
        console.error("Failed to fetch conversation:", error);
      }
    };
    fetchConversation();
  }, [activeId, loadMessages]);

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "360px 1fr" }, gap: 2 }}>
      {/* LEFT: thread list */}
      <Card sx={{ height: { md: "calc(100vh - 120px)" }, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <CardContent sx={{ pb: 1.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="h6" fontWeight={800} sx={{ color: "#b8192b" }}>
              Chat
            </Typography>
            <Chip
              size="small"
              variant="outlined"
              icon={<Person />}
              label={`Cập nhật: ${fmtTimeShort(lastUpdate.toISOString())}`}
              sx={{ fontSize: '0.7rem' }}
            />
          </Stack>
          <TextField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm tên / SĐT / RSV / STAY…"
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            textColor="inherit"
            indicatorColor="secondary"
            sx={{ mt: 1 }}
          >
            <Tab value="all" label="Tất cả" />
            <Tab value="unread" label="Chưa đọc" />
            <Tab value="active" label="Đang ở" />
          </Tabs>
        </CardContent>

        <Divider />

        <Box sx={{ flex: 1, overflowY: "auto" }}>
          <List dense disablePadding>
            {filtered.map((t) => {
              const last = t.messages[t.messages.length - 1];
              const selected = t.threadId === activeId;
              return (
                <ListItemButton
                  key={t.threadId}
                  selected={selected}
                  onClick={() => setActiveId(t.threadId)}
                  sx={{
                    alignItems: "flex-start",
                    py: 1.25,
                    "&.Mui-selected": {
                      backgroundColor: "rgba(184,25,43,0.08)",
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Badge color="error" badgeContent={t.unread} invisible={!t.unread}>
                      <Avatar sx={{ bgcolor: "#b8192b" }}>
                        <Person />
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={700}>{fullName(t.customer)}</Typography>
                        {t.booking?.Status && statusChip(t.booking.Status)}
                        {t.pinned && <Chip size="small" label="PINNED" variant="outlined" />}
                        <Box sx={{ flex: 1 }} />
                        <Typography variant="caption" color="text.secondary">
                          {fmtTimeShort(t.lastMessageAt)}
                        </Typography>
                      </Stack>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {last?.from === "staff" ? "Bạn: " : ""}{last?.text}
                      </Typography>
                    }
                  />
                </ListItemButton>
              );
            })}
            {!filtered.length && (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Không có hội thoại phù hợp.
                </Typography>
              </Box>
            )}
          </List>
        </Box>
      </Card>

      {/* RIGHT: chat box */}
      <Card sx={{ height: { md: "calc(100vh - 120px)" }, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <CardContent sx={{ pb: 1.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            {active ? (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Avatar sx={{ bgcolor: "#b8192b" }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={800}>
                    {fullName(active.customer)}
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip size="small" variant="outlined" icon={<Phone fontSize="small" />} label={active.customer?.PhoneNumber || ""} />
                    <Chip size="small" variant="outlined" icon={<Email fontSize="small" />} label={active.customer?.Email || ""} />
                    {active.booking?.Reservation_ID && (
                      <Chip size="small" variant="outlined" icon={<BookOnline fontSize="small" />} label={`#${active.booking.Reservation_ID}`} />
                    )}
                  </Stack>
                </Box>
                <Box sx={{ flex: 1 }} />
                <Tooltip title="Tùy chọn">
                  <IconButton onClick={(e) => setAnchor(e.currentTarget)}>
                    <MoreVert />
                  </IconButton>
                </Tooltip>
                <Menu open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)}>
                  <MenuItem
                    onClick={() => {
                      setAnchor(null);
                      markAllRead(active.threadId);
                    }}
                  >
                    Đánh dấu đã đọc
                  </MenuItem>
                  <MenuItem
                    onClick={async () => {
                      setAnchor(null);
                      try {
                        await toggleStaffPin(active.threadId, !active.pinned);
                        setThreads((prev) =>
                          prev.map((t) => (t.threadId === active.threadId ? { ...t, pinned: !t.pinned } : t))
                        );
                      } catch (error) {
                        console.error("Failed to toggle pin:", error);
                      }
                    }}
                  >
                    {active.pinned ? "Bỏ ghim" : "Ghim hội thoại"}
                  </MenuItem>
                </Menu>
              </Stack>
            ) : (
              <Typography variant="h6" color="text.secondary">
                Chọn một hội thoại để bắt đầu.
              </Typography>
            )}

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
                const mine = m.from === "staff";
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
                    <Person fontSize="small" />
                  </Avatar>
                  <Typography variant="caption">Đang nhập…</Typography>
                </Box>
              )}
            </Stack>
          ) : null}
        </Box>

        {/* Footer composer */}
        <Box sx={{ p: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              placeholder={active ? "Nhập tin nhắn…" : "Chọn hội thoại để nhắn…"}
              size="small"
              fullWidth
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={!active}
              onFocus={() => setTyping(true)}
              onBlur={() => setTyping(false)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Tooltip title="Chèn emoji (mock)">
                      <span>
                        <IconButton size="small" disabled={!active}>
                          <InsertEmoticon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Đính kèm (mock)">
                      <span>
                        <IconButton size="small" disabled={!active}>
                          <AttachFile fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Gửi">
                      <span>
                        <IconButton size="small" color="primary" onClick={sendMessage} disabled={!active || !text.trim()}>
                          <Send fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>

          {/* Quick replies */}
          <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
            <Chip
              size="small"
              label="Giờ CI 14:00, CO 12:00 ạ."
              onClick={() => quickReply("Khách sạn nhận phòng từ 14:00 và trả phòng trước 12:00 ạ.")}
              variant="outlined"
            />
            <Chip
              size="small"
              label="Có thể nhận sớm nếu phòng sẵn."
              onClick={() => quickReply("Có thể hỗ trợ nhận phòng sớm nếu phòng sẵn, có thể phát sinh phụ phí ạ.")}
              variant="outlined"
            />
            <Chip
              size="small"
              label="Gửi hóa đơn điện tử sau CO."
              onClick={() => quickReply("Bên em sẽ gửi hóa đơn điện tử qua email sau khi anh/chị check-out ạ.")}
              variant="outlined"
            />
            <Chip
              size="small"
              label="Thông tin bữa sáng."
              onClick={() => quickReply("Bữa sáng phục vụ 06:30–10:00 tại nhà hàng tầng 1 ạ.")}
              variant="outlined"
            />
          </Stack>

          {/* Context buttons */}
          {active && (
            <Stack direction="row" spacing={1} mt={1} justifyContent="flex-end">
              <Button variant="outlined" startIcon={<History />} onClick={openCustomer}>
                Mở Customers
              </Button>
              <Button
                variant="contained"
                startIcon={<BookOnline />}
                sx={{ backgroundColor: "#b8192b" }}
                onClick={openBooking}
                disabled={!active.booking?.Reservation_ID}
              >
                Mở Bookings
              </Button>
            </Stack>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default StaffChat;
