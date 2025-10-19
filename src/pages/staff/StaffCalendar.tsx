// src/pages/staff/StaffCalendar.tsx
import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Chip,
  Divider,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fade,
  alpha,
  useMediaQuery,
} from "@mui/material";
import {
  ChevronLeft,
  ChevronRight,
  Today as TodayIcon,
  Event as EventIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Build as BuildIcon,
  Checklist as ChecklistIcon,
  MeetingRoom as MeetingRoomIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

/* ----------------------------
   Helpers
---------------------------- */
type ViewMode = "day" | "week" | "month";
type EventType = "reservation" | "stay" | "maintenance" | "task";

type CalEvent = {
  id: string;
  type: EventType;
  title: string;
  roomNumber?: string;
  roomId?: number;
  stayId?: number;
  reservationId?: string;
  startsAt: string; // ISO
  endsAt: string;   // ISO
  status?: "pending" | "confirmed" | "checked-in" | "checked-out" | "in-progress" | "done";
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
};
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const toISODate = (d: Date) => d.toISOString().slice(0, 10);

/* ----------------------------
   Mock data (UI only)
---------------------------- */
const ROOMS = [
  { Room_ID: 1, Number: "101", RoomType: "Standard" },
  { Room_ID: 2, Number: "102", RoomType: "Deluxe" },
  { Room_ID: 3, Number: "201", RoomType: "Suite" },
];

const TODAY = startOfDay(new Date());

const MOCK_EVENTS: CalEvent[] = [
  // Reservations
  {
    id: "rs1",
    type: "reservation",
    title: "Reservation RSV-1001 • John Doe",
    roomNumber: "101",
    reservationId: "RSV-1001",
    startsAt: addDays(TODAY, 0).toISOString(),
    endsAt: addDays(TODAY, 2).toISOString(),
    status: "confirmed",
  },
  {
    id: "rs2",
    type: "reservation",
    title: "Reservation RSV-1004 • Alice Brown",
    roomNumber: "103",
    reservationId: "RSV-1004",
    startsAt: addDays(TODAY, 1).toISOString(),
    endsAt: addDays(TODAY, 3).toISOString(),
    status: "pending",
  },
  // Stays
  {
    id: "st1",
    type: "stay",
    title: "Stay STAY-1101 • Nguyen A",
    roomNumber: "102",
    roomId: 2,
    stayId: 1101,
    startsAt: addDays(TODAY, -1).toISOString(),
    endsAt: addDays(TODAY, 1).toISOString(),
    status: "checked-in",
  },
  // Maintenance
  {
    id: "mt1",
    type: "maintenance",
    title: "Bảo trì phòng 201 (A/C)",
    roomNumber: "201",
    roomId: 3,
    startsAt: addDays(TODAY, 0).toISOString(),
    endsAt: addDays(TODAY, 0).toISOString(),
    status: "in-progress",
  },
  // Task
  {
    id: "tk1",
    type: "task",
    title: "Chuẩn bị giường phụ phòng 101",
    roomNumber: "101",
    roomId: 1,
    startsAt: addDays(TODAY, 0).toISOString(),
    endsAt: addDays(TODAY, 0).toISOString(),
    status: "pending",
  },
];

/* ----------------------------
   Color / Icon meta
---------------------------- */
const burgundy = "#b8192b";
const navy = "#0049a9";

const TYPE_META: Record<
  EventType,
  {
    color: string;
    chipBg: string;
    border: string;
    gradient: string;
    icon: React.ReactNode;
    label: string;
  }
> = {
  reservation: {
    color: navy,
    chipBg: alpha(navy, 0.08),
    border: alpha(navy, 0.3),
    gradient: `linear-gradient(135deg, ${alpha(navy, 0.06)}, ${alpha("#7aa2ff", 0.14)})`,
    icon: <EventIcon fontSize="small" />,
    label: "Reservation",
  },
  stay: {
    color: burgundy,
    chipBg: alpha(burgundy, 0.10),
    border: alpha(burgundy, 0.28),
    gradient: `linear-gradient(135deg, ${alpha(burgundy, 0.08)}, ${alpha("#ff9aa7", 0.16)})`,
    icon: <MeetingRoomIcon fontSize="small" />,
    label: "Stay",
  },
  maintenance: {
    color: "#b7791f",
    chipBg: alpha("#b7791f", 0.12),
    border: alpha("#b7791f", 0.28),
    gradient: `linear-gradient(135deg, ${alpha("#b7791f", 0.10)}, ${alpha("#f6ad55", 0.20)})`,
    icon: <BuildIcon fontSize="small" />,
    label: "Maintenance",
  },
  task: {
    color: "#0f766e",
    chipBg: alpha("#0f766e", 0.12),
    border: alpha("#0f766e", 0.28),
    gradient: `linear-gradient(135deg, ${alpha("#0f766e", 0.10)}, ${alpha("#34d399", 0.18)})`,
    icon: <ChecklistIcon fontSize="small" />,
    label: "Task",
  },
};

/* ----------------------------
   Component
---------------------------- */
const StaffCalendar: React.FC = () => {
  const navigate = useNavigate();
  const isMdDown = useMediaQuery("(max-width:900px)");

  const [view, setView] = React.useState<ViewMode>("week");
  const [cursor, setCursor] = React.useState<Date>(TODAY);
  const [keyword, setKeyword] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<EventType | "ALL">("ALL");
  const [roomFilter, setRoomFilter] = React.useState<number | "ALL">("ALL");

  const [openEvt, setOpenEvt] = React.useState(false);
  const [activeEvt, setActiveEvt] = React.useState<CalEvent | null>(null);

  const headerLabel = React.useMemo(() => {
    if (view === "day") {
      return cursor.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
    if (view === "week") {
      const start = addDays(cursor, -cursor.getDay());
      const end = addDays(start, 6);
      return `${start.toLocaleDateString("vi-VN")} → ${end.toLocaleDateString("vi-VN")}`;
    }
    return cursor.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
  }, [cursor, view]);

  const rangeDays = React.useMemo(() => {
    if (view === "day") return [cursor];
    if (view === "week") {
      const start = addDays(cursor, -cursor.getDay());
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    // month: 6 rows grid
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = addDays(first, -first.getDay());
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [cursor, view]);

  const filtered = React.useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return MOCK_EVENTS.filter((ev) => {
      const inType = typeFilter === "ALL" || ev.type === typeFilter;
      const inRoom =
        roomFilter === "ALL" ||
        ev.roomId === roomFilter ||
        ev.roomNumber === ROOMS.find((r) => r.Room_ID === roomFilter)?.Number;
      const text = `${ev.title} ${ev.roomNumber || ""} ${ev.reservationId || ""} ${ev.stayId || ""}`.toLowerCase();
      const inKw = !kw || text.includes(kw);
      return inType && inRoom && inKw;
    });
  }, [keyword, typeFilter, roomFilter]);

  const eventsByDay = React.useMemo(() => {
    const groups = new Map<string, CalEvent[]>();
    for (const ev of filtered) {
      const s = startOfDay(new Date(ev.startsAt));
      const e = startOfDay(new Date(ev.endsAt));
      const days = Math.max(1, Math.round((+e - +s) / (1000 * 60 * 60 * 24))) + 1; // inclusive
      for (let i = 0; i < days; i++) {
        const d = toISODate(addDays(s, i));
        if (!groups.has(d)) groups.set(d, []);
        groups.get(d)!.push(ev);
      }
    }
    return groups;
  }, [filtered]);

  const goPrev = () => {
    if (view === "day") setCursor(addDays(cursor, -1));
    else if (view === "week") setCursor(addDays(cursor, -7));
    else setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  };
  const goNext = () => {
    if (view === "day") setCursor(addDays(cursor, 1));
    else if (view === "week") setCursor(addDays(cursor, 7));
    else setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
  };
  const goToday = () => setCursor(TODAY);

  const openEvent = (ev: CalEvent) => {
    setActiveEvt(ev);
    setOpenEvt(true);
  };
  const closeEvent = () => {
    setOpenEvt(false);
    setActiveEvt(null);
  };

  /* ----------------------------
     Render helpers
  ---------------------------- */
  const WeekdayHeader: React.FC = () => {
    const labels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 1,
          mb: 1,
        }}
      >
        {labels.map((lb, i) => (
          <Box
            key={lb}
            sx={{
              p: 1,
              textAlign: "center",
              borderRadius: 1,
              color: i === 0 ? burgundy : "text.secondary",
              fontWeight: 700,
              bgcolor: alpha("#000", 0.02),
              border: "1px solid",
              borderColor: alpha("#000", 0.06),
            }}
          >
            {lb}
          </Box>
        ))}
      </Box>
    );
  };

  const DayCell: React.FC<{ date: Date; compact?: boolean }> = ({ date, compact }) => {
    const dayKey = toISODate(date);
    const items = eventsByDay.get(dayKey) || [];
    const isToday = sameDay(date, TODAY);

    return (
      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          border: "1px solid",
          borderColor: alpha("#000", 0.06),
          bgcolor: "#fff",
          overflow: "hidden",
          transition: "all .18s ease",
          "&:hover": { boxShadow: "0 8px 22px rgba(0,0,0,0.08)", transform: "translateY(-1px)" },
        }}
      >
        <CardContent sx={{ p: 1.25 }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <Typography variant="subtitle2" fontWeight={800}>
              {date.getDate()}
            </Typography>
            {isToday && <Chip size="small" color="secondary" label="Hôm nay" />}
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" color="text.secondary">
              {date.toLocaleDateString("vi-VN", { weekday: "short" })}
            </Typography>
          </Stack>

          <Stack spacing={0.75}>
            {items.length === 0 ? (
              <Typography variant="caption" color="text.secondary">
                Không có sự kiện
              </Typography>
            ) : (
              items.slice(0, compact ? 5 : 7).map((ev) => {
                const meta = TYPE_META[ev.type];
                return (
                  <Fade in key={`${ev.id}-${dayKey}`}>
                    <Box
                      onClick={() => openEvent(ev)}
                      sx={{
                        px: 1,
                        py: 0.5,
                        borderRadius: 1.2,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        bgcolor: meta.chipBg,
                        border: `1px solid ${meta.border}`,
                        transition: "all .15s ease",
                        "&:hover": {
                          bgcolor: alpha(meta.color, 0.12),
                          transform: "translateY(-1px)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: 1,
                          bgcolor: meta.color,
                          boxShadow: `0 0 0 3px ${alpha(meta.color, 0.18)} inset`,
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ color: meta.color, fontWeight: 700, letterSpacing: 0.2 }}
                      >
                        {ev.type === "reservation"
                          ? `RSV ${ev.reservationId?.replace("RSV-", "")}`
                          : ev.type === "stay"
                          ? `STAY ${ev.stayId}`
                          : ev.type === "maintenance"
                          ? "Maint"
                          : "Task"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        • {ev.roomNumber || "—"} • {ev.title.split("•")[0].trim()}
                      </Typography>
                    </Box>
                  </Fade>
                );
              })
            )}
            {items.length > (compact ? 5 : 7) && (
              <Typography variant="caption" color="text.secondary">
                +{items.length - (compact ? 5 : 7)} more
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  };

  /* ----------------------------
     UI
  ---------------------------- */
  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Glass header */}
      <Card
        elevation={0}
        sx={{
          mb: 2,
          borderRadius: 2,
          border: "1px solid",
          borderColor: alpha("#000", 0.06),
          bgcolor: alpha("#fff", 0.7),
          backdropFilter: "saturate(180%) blur(8px)",
        }}
      >
        <CardContent sx={{ py: 1.25 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems="center">
            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: "100%" }}>
              <Typography variant="h5" fontWeight={900} sx={{ color: burgundy }}>
                Calendar
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Stack direction="row" spacing={0.5} alignItems="center">
                <IconButton onClick={goPrev} size="small">
                  <ChevronLeft />
                </IconButton>
                <Button variant="outlined" startIcon={<TodayIcon />} onClick={goToday} size="small">
                  Hôm nay
                </Button>
                <IconButton onClick={goNext} size="small">
                  <ChevronRight />
                </IconButton>
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
              <TextField
                label="Tìm (mã RSV/STAY, phòng, tên...)"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                fullWidth
                size="small"
              />

              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Loại</InputLabel>
                <Select
                  label="Loại"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                >
                  <MenuItem value={"ALL" as any}>Tất cả</MenuItem>
                  <MenuItem value="reservation">{TYPE_META.reservation.label}</MenuItem>
                  <MenuItem value="stay">{TYPE_META.stay.label}</MenuItem>
                  <MenuItem value="maintenance">{TYPE_META.maintenance.label}</MenuItem>
                  <MenuItem value="task">{TYPE_META.task.label}</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Phòng</InputLabel>
                <Select
                  label="Phòng"
                  value={roomFilter}
                  onChange={(e) => setRoomFilter(e.target.value as any)}
                >
                  <MenuItem value={"ALL" as any}>Tất cả</MenuItem>
                  {ROOMS.map((r) => (
                    <MenuItem key={r.Room_ID} value={r.Room_ID}>
                      {r.Number} • {r.RoomType}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <ToggleButtonGroup
                exclusive
                size="small"
                value={view}
                onChange={(_, v) => v && setView(v)}
              >
                <ToggleButton value="day">Ngày</ToggleButton>
                <ToggleButton value="week">Tuần</ToggleButton>
                <ToggleButton value="month">Tháng</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Range label with soft divider */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
          {headerLabel}
        </Typography>
        <Divider flexItem sx={{ mx: 1 }} />
        {/* Legend compact */}
        <Stack direction="row" gap={0.75} flexWrap="wrap">
          {(Object.keys(TYPE_META) as EventType[]).map((t) => (
            <Chip
              key={t}
              size="small"
              icon={TYPE_META[t].icon as any}
              label={TYPE_META[t].label}
              sx={{
                bgcolor: TYPE_META[t].chipBg,
                color: TYPE_META[t].color,
                "& .MuiChip-icon": { color: TYPE_META[t].color },
                border: `1px dashed ${TYPE_META[t].border}`,
              }}
            />
          ))}
        </Stack>
      </Stack>

      {/* Calendar board */}
      {view === "day" && (
        <Box>
          <DayCell date={cursor} />
        </Box>
      )}

      {view === "week" && (
        <>
          <WeekdayHeader />
          <Box
            sx={{
              display: "grid",
              gap: 1,
              gridTemplateColumns: "repeat(7, 1fr)",
            }}
          >
            {rangeDays.map((d) => (
              <DayCell key={d.toISOString()} date={d} compact />
            ))}
          </Box>
        </>
      )}

      {view === "month" && (
        <>
          {!isMdDown && <WeekdayHeader />}
          <Box
            sx={{
              display: "grid",
              gap: 1,
              gridTemplateColumns: "repeat(7, 1fr)",
            }}
          >
            {rangeDays.map((d, i) => (
              <DayCell key={`${d.toISOString()}-${i}`} date={d} compact />
            ))}
          </Box>
        </>
      )}

      {/* Event detail dialog */}
      <Dialog open={openEvt} onClose={closeEvent} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Chi tiết sự kiện</DialogTitle>
        <DialogContent dividers sx={{ background: alpha("#000", 0.015) }}>
          {activeEvt ? (
            <Stack spacing={1.2}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: TYPE_META[activeEvt.type].border,
                  background: TYPE_META[activeEvt.type].gradient,
                }}
              >
                <CardContent sx={{ py: 1.25 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {TYPE_META[activeEvt.type].icon}
                    <Typography variant="h6" fontWeight={800} sx={{ color: TYPE_META[activeEvt.type].color }}>
                      {TYPE_META[activeEvt.type].label}
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                    {activeEvt.roomNumber && <Chip size="small" label={`Phòng ${activeEvt.roomNumber}`} />}
                  </Stack>
                </CardContent>
              </Card>

              <Typography variant="subtitle2" sx={{ mt: 0.5 }}>
                {activeEvt.title}
              </Typography>

              <Divider />

              <Typography variant="body2" color="text.secondary">
                Bắt đầu: {new Date(activeEvt.startsAt).toLocaleString("vi-VN")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Kết thúc: {new Date(activeEvt.endsAt).toLocaleString("vi-VN")}
              </Typography>

              {activeEvt.type === "reservation" && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Mã Reservation: <b>{activeEvt.reservationId}</b>
                </Typography>
              )}
              {activeEvt?.type === "stay" && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Mã Stay: <b>{activeEvt.stayId}</b>
                </Typography>
              )}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Không có dữ liệu.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          {/* Contextual actions */}
          {activeEvt?.type === "reservation" && (
            <>
              <Button
                variant="outlined"
                onClick={() => {
                  navigate("/staff/bookings", { state: { focus: activeEvt.reservationId } });
                  closeEvent();
                }}
              >
                Xem Booking
              </Button>
              <Button
                variant="contained"
                startIcon={<LoginIcon />}
                sx={{ backgroundColor: burgundy }}
                disabled={new Date() < new Date(activeEvt.startsAt)}
                onClick={() => {
                  // Truyền dữ liệu phù hợp format của Check-in (giống StaffBookings.createStayAndCheckIn)
                  const bookingData = {
                    code: activeEvt.reservationId || "RSV-UNKNOWN",
                    guestName: activeEvt.title.split("•")[1]?.trim() || "Guest",
                    phone: "",
                    email: "",
                    roomType: "Standard" as const,
                    roomNumber: activeEvt.roomNumber || "",
                    adults: 2,
                    children: 0,
                    checkIn: toISODate(new Date()),
                    checkOut: toISODate(addDays(new Date(), 1)),
                    pricePerNight: 1_200_000,
                    source: "Direct" as const,
                    note: "",
                  };
                  navigate("/staff/checkin", { state: { bookingData } });
                  closeEvent();
                }}
              >
                Check-in
              </Button>
              {new Date() < new Date(activeEvt.startsAt) && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  Chưa tới thời gian check-in
                </Typography>
              )}
            </>
          )}

          {activeEvt?.type === "stay" && (
            <>
              <Button
                variant="outlined"
                onClick={() => {
                  navigate(`/staff/rooms`, { state: { filterRoom: activeEvt.roomNumber } });
                  closeEvent();
                }}
              >
                Tới phòng
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<LogoutIcon />}
                onClick={() => {
                  // Truyền dữ liệu tối thiểu cho Check-out để trang tự prefill
                  const stayData = {
                    stayId: String(activeEvt.stayId || "STAY-CAL"),
                    guestName: activeEvt.title.split("•")[1]?.trim() || "Guest",
                    phone: "",
                    email: "",
                    roomType: "Standard" as const,
                    roomNumber: activeEvt.roomNumber || "",
                    checkIn: `${toISODate(addDays(new Date(), -1))} 14:00`,
                    checkOutPlan: `${toISODate(addDays(new Date(), 1))} 12:00`,
                    pricePerNight: 1_200_000,
                    nightsSoFar: 1,
                    deposit: 0,
                    prepostedServices: [],
                  };
                  navigate("/staff/checkout", { state: { stayData } });
                  closeEvent();
                }}
              >
                Check-out
              </Button>
            </>
          )}

          {activeEvt?.type === "maintenance" && (
            <Button
              variant="contained"
              startIcon={<BuildIcon />}
              onClick={() => {
                // mở phòng để đánh dấu bảo trì (UI-only)
                navigate("/staff/rooms", { state: { filterRoom: activeEvt.roomNumber } });
                closeEvent();
              }}
            >
              Quản lý bảo trì
            </Button>
          )}

          {activeEvt?.type === "task" && (
            <Button
              variant="contained"
              startIcon={<ChecklistIcon />}
              onClick={() => {
                navigate("/staff/tasks", { state: { focusTask: activeEvt.id } });
                closeEvent();
              }}
            >
              Mở Task
            </Button>
          )}

          <Button onClick={closeEvent}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffCalendar;
