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
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

/* =========================
   Mock & types (đồng bộ Hotel_ID / Accounts / Bookings)
   ========================= */
type AccountStatus = "active" | "inactive" | "banned";
type BookingStatus = "confirmed" | "pending" | "cancelled";

type CustomerLite = {
  Account_ID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  PhoneNumber: string;
  Status: AccountStatus;
};

type Message = {
  id: string;
  from: "customer" | "staff";
  text: string;
  time: string; // ISO
};

type Conversation = {
  threadId: string;
  customer: CustomerLite;
  hotelId: number;
  lastMessageAt: string; // ISO
  unread: number;
  pinned?: boolean;
  booking?: {
    Reservation_ID: string;
    Stay_ID?: string;
    RoomNumber?: string;
    Status: BookingStatus;
    CheckIn?: string;
    CheckOut?: string;
  };
  messages: Message[];
};

const currentHotelId = 1;

const CUSTOMERS: CustomerLite[] = [
  { Account_ID: 11, FirstName: "John", LastName: "Doe", Email: "john.doe@email.com", PhoneNumber: "0900000001", Status: "active" },
  { Account_ID: 12, FirstName: "Jane", LastName: "Smith", Email: "jane.smith@email.com", PhoneNumber: "0900000002", Status: "active" },
  { Account_ID: 13, FirstName: "Bob", LastName: "Johnson", Email: "bob.johnson@email.com", PhoneNumber: "0900000003", Status: "inactive" },
];

const CONVERSATIONS_SEED: Conversation[] = [
  {
    threadId: "T-1001",
    hotelId: 1,
    customer: CUSTOMERS[0],
    lastMessageAt: "2025-10-18T10:45:00Z",
    unread: 2,
    pinned: true,
    booking: {
      Reservation_ID: "RSV-1001",
      Stay_ID: "STAY-1101",
      RoomNumber: "507",
      Status: "confirmed",
      CheckIn: "2025-10-18",
      CheckOut: "2025-10-20",
    },
    messages: [
      { id: "m1", from: "customer", text: "Chào lễ tân, mấy giờ check-in ạ?", time: "2025-10-18T10:40:00Z" },
      { id: "m2", from: "staff", text: "Check-in từ 14:00 anh/chị nhé.", time: "2025-10-18T10:42:00Z" },
      { id: "m3", from: "customer", text: "Ok. Có thể nhận sớm không ạ?", time: "2025-10-18T10:45:00Z" },
    ],
  },
  {
    threadId: "T-1002",
    hotelId: 1,
    customer: CUSTOMERS[1],
    lastMessageAt: "2025-10-18T09:20:00Z",
    unread: 0,
    booking: {
      Reservation_ID: "RSV-1002",
      Stay_ID: "STAY-1102",
      RoomNumber: "103",
      Status: "confirmed",
      CheckIn: "2025-10-16",
      CheckOut: "2025-10-20",
    },
    messages: [
      { id: "m1", from: "customer", text: "Cho mình xin hóa đơn điện tử sau khi trả phòng nhé.", time: "2025-10-18T09:05:00Z" },
      { id: "m2", from: "staff", text: "Dạ được ạ, mình sẽ gửi qua email sau khi check-out.", time: "2025-10-18T09:12:00Z" },
      { id: "m3", from: "customer", text: "Cảm ơn bạn!", time: "2025-10-18T09:20:00Z" },
    ],
  },
  {
    threadId: "T-1003",
    hotelId: 2, // khách sạn khác -> sẽ bị lọc khỏi danh sách staff hotelId=1
    customer: CUSTOMERS[2],
    lastMessageAt: "2025-10-17T20:10:00Z",
    unread: 1,
    booking: {
      Reservation_ID: "RSV-0990",
      Status: "pending",
    },
    messages: [{ id: "m1", from: "customer", text: "Còn phòng Deluxe cuối tuần này không?", time: "2025-10-17T20:10:00Z" }],
  },
];

/* =========================
   Helpers
   ========================= */
const fmtTimeShort = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

const statusChip = (s: BookingStatus) =>
  s === "confirmed" ? (
    <Chip size="small" color="success" icon={<CheckCircle fontSize="small" />} label="Confirmed" />
  ) : s === "pending" ? (
    <Chip size="small" color="warning" icon={<AccessTime fontSize="small" />} label="Pending" />
  ) : (
    <Chip size="small" color="error" icon={<Cancel fontSize="small" />} label="Cancelled" />
  );

const fullName = (c: CustomerLite) => `${c.FirstName} ${c.LastName}`;

/* =========================
   Component
   ========================= */
const StaffChat: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState("");
  const [tab, setTab] = React.useState<"all" | "unread" | "active">("all");
  const [threads, setThreads] = React.useState<Conversation[]>(
    CONVERSATIONS_SEED.filter((t) => t.hotelId === currentHotelId)
  );

  const [activeId, setActiveId] = React.useState<string | null>(threads[0]?.threadId ?? null);
  const active = React.useMemo(() => threads.find((t) => t.threadId === activeId) || null, [threads, activeId]);

  // search + filter
  const filtered = React.useMemo(() => {
    const kw = query.trim().toLowerCase();
    return threads
      .filter((t) => {
        const matchKw =
          !kw ||
          fullName(t.customer).toLowerCase().includes(kw) ||
          t.customer.PhoneNumber.includes(kw) ||
          t.booking?.Reservation_ID?.toLowerCase().includes(kw) ||
          t.booking?.Stay_ID?.toLowerCase().includes(kw);
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

  const sendMessage = () => {
    if (!active || !text.trim()) return;
    const msg: Message = { id: `m-${Date.now()}`, from: "staff", text: text.trim(), time: new Date().toISOString() };
    setThreads((prev) =>
      prev.map((t) =>
        t.threadId === active.threadId
          ? {
              ...t,
              messages: [...t.messages, msg],
              lastMessageAt: msg.time,
              unread: 0, // đã phản hồi
            }
          : t
      )
    );
    setText("");
  };

  const markAllRead = (threadId: string) => {
    setThreads((prev) => prev.map((t) => (t.threadId === threadId ? { ...t, unread: 0 } : t)));
  };

  const quickReply = (tpl: string) => setText((s) => (s ? s + " " + tpl : tpl));

  const openCustomer = () => {
    if (!active) return;
    navigate("/staff/customers", { state: { q: active.customer.PhoneNumber } });
  };

  const openBooking = () => {
    if (!active?.booking?.Reservation_ID) return;
    navigate("/staff/bookings", { state: { q: active.booking.Reservation_ID } });
  };

  // khi chọn thread => đánh dấu đã đọc
  React.useEffect(() => {
    if (!active) return;
    markAllRead(active.threadId);
  }, [activeId]); // eslint-disable-line

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "360px 1fr" }, gap: 2 }}>
      {/* LEFT: thread list */}
      <Card sx={{ height: { md: "calc(100vh - 120px)" }, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <CardContent sx={{ pb: 1.5 }}>
          <Typography variant="h6" fontWeight={800} sx={{ color: "#b8192b", mb: 1 }}>
            Chat
          </Typography>
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
                  <Chip size="small" variant="outlined" icon={<Phone fontSize="small" />} label={active.customer.PhoneNumber} />
                  <Chip size="small" variant="outlined" icon={<Email fontSize="small" />} label={active.customer.Email} />
                  {active.booking?.Reservation_ID && (
                    <Chip size="small" variant="outlined" icon={<BookOnline fontSize="small" />} label={`#${active.booking.Reservation_ID}`} />
                  )}
                  {active.booking?.Stay_ID && (
                    <Chip size="small" variant="outlined" icon={<History fontSize="small" />} label={`#${active.booking.Stay_ID}`} />
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
                  onClick={() => {
                    setAnchor(null);
                    // mock: ghim
                    setThreads((prev) =>
                      prev.map((t) => (t.threadId === active.threadId ? { ...t, pinned: !t.pinned } : t))
                    );
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
        </CardContent>

        <Divider />

        {/* Messages */}
        <Box sx={{ flex: 1, overflowY: "auto", p: 2, backgroundColor: "#fafafa" }}>
          {active ? (
            <Stack spacing={1.2}>
              {active.messages.map((m) => {
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
              {typing && (
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
