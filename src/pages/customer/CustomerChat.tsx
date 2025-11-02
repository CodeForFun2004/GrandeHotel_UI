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
} from "@mui/material";
import {
  Send,
  InsertEmoticon,
  Person,
  BookOnline,
} from "@mui/icons-material";
import { Avatar } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import {
  getCustomerConversation,
  sendCustomerMessage,
  type Conversation,
} from "../../api/chat";

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
   Component
   ========================= */
const CustomerChat: React.FC = () => {
  const navigate = useNavigate();
  const { threadId } = useParams<{ threadId: string }>();
  const [conversation, setConversation] = React.useState<Conversation | null>(null);
  const [loading, setLoading] = React.useState(true);

  // composer
  const [text, setText] = React.useState("");
  const [typing, setTyping] = React.useState(false);

  const sendMessage = async () => {
    if (!conversation || !text.trim()) return;
    try {
      await sendCustomerMessage(conversation.threadId, { text: text.trim() });
      // Refetch conversation to update messages
      const updated = await getCustomerConversation(conversation.threadId);
      setConversation(updated);
      setText("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const openBooking = () => {
    if (!conversation?.booking?.Reservation_ID) return;
    navigate("/customer/bookings", { state: { q: conversation.booking.Reservation_ID } });
  };

  // Fetch conversation on mount
  React.useEffect(() => {
    if (!threadId) return;

    const fetchConversation = async () => {
      setLoading(true);
      try {
        const data = await getCustomerConversation(threadId);
        setConversation(data);
      } catch (error) {
        console.error("Failed to fetch conversation:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConversation();
  }, [threadId]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <Typography>Đang tải...</Typography>
      </Box>
    );
  }

  if (!conversation) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" color="text.secondary">
          Không tìm thấy hội thoại.
        </Typography>
      </Box>
    );
  }

  return (
    <Card sx={{ height: { md: "calc(100vh - 120px)" }, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <CardContent sx={{ pb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Avatar sx={{ bgcolor: "#b8192b" }}>
            <Person />
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Chat với Khách sạn
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {conversation.booking?.Reservation_ID && (
                <Chip size="small" variant="outlined" icon={<BookOnline />} label={`#${conversation.booking.Reservation_ID}`} />
              )}
              {conversation.booking?.Status && statusChip(conversation.booking.Status)}
            </Stack>
          </Box>
          <Box sx={{ flex: 1 }} />
        </Stack>
      </CardContent>

      <Divider />

      {/* Messages */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 2, backgroundColor: "#fafafa" }}>
        <Stack spacing={1.2}>
          {conversation.messages.map((m) => {
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
          {typing && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
              <Avatar sx={{ width: 24, height: 24 }}>
                <Person />
              </Avatar>
              <Typography variant="caption">Đang nhập…</Typography>
            </Box>
          )}
        </Stack>
      </Box>

      {/* Footer composer */}
      <Box sx={{ p: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            placeholder="Nhập tin nhắn…"
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

        {/* Context buttons */}
        {conversation.booking?.Reservation_ID && (
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
  );
};

export default CustomerChat;
