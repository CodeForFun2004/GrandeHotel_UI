import { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Avatar,
  TextField,
  MenuItem,
  Tooltip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import LinkIcon from "@mui/icons-material/Link";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { useNavigate } from "react-router-dom";
import { formatVND } from "../../utils/formatCurrency";
import { STAFF_PATHS } from "../../utils/constant/enum";

/** ---------------- Mock data (demo) ---------------- */
const BOOKINGS_TODAY = [
  { code: "STAY001", guest: "Nguyen A", room: "302", action: "Check-in", time: "09:30" },
  { code: "STAY002", guest: "Tran B", room: "507", action: "Check-in", time: "10:15" },
  { code: "STAY003", guest: "Le C", room: "208", action: "Check-out", time: "11:00" },
  { code: "STAY004", guest: "Vo D", room: "801", action: "Check-in", time: "14:00" },
];

const ROOMS_BY_TYPE = [
  { type: "Standard", total: 40, occupied: 28 },
  { type: "Deluxe", total: 30, occupied: 22 },
  { type: "Suite", total: 10, occupied: 7 },
];

const REVENUE_BY_CHANNEL = [
  { channel: "Direct", value: 5200 },
  { channel: "OTA", value: 4200 },
  { channel: "Corporate", value: 1800 },
];

const SPARK_A = [22, 24, 20, 26, 28, 27, 30]; // rooms available
const SPARK_B = [8, 10, 9, 12, 11, 13, 12];   // check-ins
const SPARK_C = [6, 7, 9, 8, 10, 9, 9];       // check-outs
const SPARK_D = [72, 74, 76, 78, 77, 79, 80]; // occupancy %

/** Utility to build spark SVG path */
function sparkPath(values: number[], w = 120, h = 36, pad = 4) {
  if (!values.length) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const scaleX = (w - pad * 2) / (values.length - 1 || 1);
  const scaleY = (h - pad * 2) / (max - min || 1);
  return values
    .map((v, i) => {
      const x = pad + i * scaleX;
      const y = h - pad - (v - min) * scaleY;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export default function Dashboard() {
  const navigate = useNavigate();

  // Filters (demo)
  const [range, setRange] = useState<"today" | "7d" | "30d">("today");
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });

  const totals = useMemo(() => {
    const roomsAvailable = ROOMS_BY_TYPE.reduce((acc, t) => acc + (t.total - t.occupied), 0);
    const checkins = BOOKINGS_TODAY.filter((b) => b.action === "Check-in").length;
    const checkouts = BOOKINGS_TODAY.filter((b) => b.action === "Check-out").length;
    const occupancy =
      Math.round(
        (ROOMS_BY_TYPE.reduce((a, b) => a + b.occupied, 0) /
          ROOMS_BY_TYPE.reduce((a, b) => a + b.total, 0)) *
          100
      ) || 0;
    const revenue = REVENUE_BY_CHANNEL.reduce((a, b) => a + b.value, 0);
    return { roomsAvailable, checkins, checkouts, occupancy, revenue };
  }, []);

  const kpis = [
    {
      label: "Rooms Available",
      value: totals.roomsAvailable,
      icon: <MeetingRoomIcon />,
      color: "#2e7d32",
      spark: SPARK_A,
      suffix: "",
    },
    {
      label: "Today's Check-ins",
      value: totals.checkins,
      icon: <LoginIcon />,
      color: "#0288d1",
      spark: SPARK_B,
      suffix: "",
    },
    {
      label: "Today's Check-outs",
      value: totals.checkouts,
      icon: <LogoutIcon />,
      color: "#fb8c00",
      spark: SPARK_C,
      suffix: "",
    },
    {
      label: "Occupancy",
      value: `${totals.occupancy}%`,
      icon: <TrendingUpIcon />,
      color: "#7b1fa2",
      spark: SPARK_D,
      suffix: "",
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between" spacing={1} mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Staff Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            Tổng quan theo ca • theo dõi check-in/out, phòng trống, doanh thu kênh.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            select
            label="Range"
            value={range}
            onChange={(e) => setRange(e.target.value as any)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="7d">Last 7 days</MenuItem>
            <MenuItem value="30d">Last 30 days</MenuItem>
          </TextField>
          <TextField
            size="small"
            type="date"
            label="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </Stack>

      {/* KPI cards */}
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" } }}>
        {kpis.map((k) => {
          const path = sparkPath(k.spark);
          return (
            <Box key={k.label}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <Avatar sx={{ width: 36, height: 36, bgcolor: `${k.color}22`, color: k.color }}>
                        {k.icon}
                      </Avatar>
                      <Typography variant="body2" color="text.secondary">
                        {k.label}
                      </Typography>
                    </Stack>
                    <Chip label="live" size="small" color="success" variant="outlined" />
                  </Stack>

                  <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.1 }}>
                    {k.value}
                  </Typography>

                  {/* sparkline */}
                  <Box sx={{ mt: 1 }}>
                    <svg width="100%" height="36" viewBox="0 0 120 36" preserveAspectRatio="none" style={{ display: "block" }}>
                      <path d={path} fill="none" stroke={k.color} strokeWidth="2" />
                      {/* baseline */}
                      <line x1="0" y1="32" x2="120" y2="32" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
                    </svg>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          );
        })}
      </Box>

      {/* Middle row: Quick actions + Bookings today */}
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "5fr 7fr" }, mt: 0.5 }}>
        <Box>
          <Card sx={{ height: "100%", borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" mb={1}>Quick Actions</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap">
                <Button
                  variant="contained"
                  onClick={() => navigate(STAFF_PATHS.CHECKIN)}
                  startIcon={<LoginIcon />}
                  sx={{ textTransform: "none" }}
                >
                  Start Check-in
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate(STAFF_PATHS.CHECKOUT)}
                  startIcon={<LogoutIcon />}
                  sx={{ textTransform: "none" }}
                >
                  Start Check-out
                </Button>
                <Button onClick={() => navigate(STAFF_PATHS.CALENDAR)} startIcon={<CalendarMonthIcon />}>
                  Open Calendar
                </Button>
                <Button onClick={() => navigate(STAFF_PATHS.BOOKINGS)} startIcon={<LinkIcon />}>
                  Manage Bookings
                </Button>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>Ca làm việc</Typography>
              <Stack direction="row" spacing={1}>
                <Chip label="Morning 06:00–14:00" color="primary" variant="outlined" />
                <Chip label="Front Desk" variant="outlined" />
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card sx={{ height: "100%", borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h6">Bookings hôm nay</Typography>
                <Button size="small" onClick={() => navigate(STAFF_PATHS.BOOKINGS)}>View all</Button>
              </Stack>
              <Paper variant="outlined" sx={{ maxHeight: 280, overflow: "auto" }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Code</TableCell>
                      <TableCell>Guest</TableCell>
                      <TableCell>Room</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell align="right">Open</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {BOOKINGS_TODAY.map((b) => (
                      <TableRow key={b.code} hover>
                        <TableCell>{b.time}</TableCell>
                        <TableCell>{b.code}</TableCell>
                        <TableCell>{b.guest}</TableCell>
                        <TableCell>{b.room}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={b.action}
                            color={b.action === "Check-in" ? "success" : "warning"}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small">Open</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Bottom row: Occupancy by room type + Revenue by channel */}
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, mt: 0.5 }}>
        <Box>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <PeopleAltIcon color="primary" />
                <Typography variant="h6">Occupancy theo hạng phòng</Typography>
              </Stack>
              <Stack spacing={1.5}>
                {ROOMS_BY_TYPE.map((t) => {
                  const occ = Math.round((t.occupied / t.total) * 100);
                  return (
                    <Box key={t.type}>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" fontWeight={600}>
                          {t.type}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t.occupied}/{t.total} • {occ}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={occ}
                        sx={{
                          height: 8,
                          borderRadius: 999,
                          "& .MuiLinearProgress-bar": { borderRadius: 999 },
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <MonetizationOnIcon color="primary" />
                <Typography variant="h6">Doanh thu theo kênh</Typography>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="flex-end" sx={{ height: 160, mt: 1 }}>
                {REVENUE_BY_CHANNEL.map((c) => {
                  const max = Math.max(...REVENUE_BY_CHANNEL.map((x) => x.value));
                  const h = (c.value / max) * 120 + 20;
                  return (
                    <Box key={c.channel} textAlign="center" sx={{ flex: 1 }}>
                      <Tooltip title={formatVND(c.value)}>
                        <Box
                          sx={{
                            mx: 0.75,
                            height: h,
                            bgcolor: "#1976d233",
                            border: "1px solid #1976d255",
                            borderRadius: 1,
                          }}
                        />
                      </Tooltip>
                      <Typography variant="caption" color="text.secondary">
                        {c.channel}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ width: 28, height: 28, bgcolor: "#1976d233", color: "#1976d2" }}>
                  <ReceiptLongIcon fontSize="small" />
                </Avatar>
                <Typography variant="body2" color="text.secondary">
                  Tổng doanh thu hôm nay: {" "}
                  <Typography component="span" fontWeight={700} color="text.primary">
                    {formatVND(REVENUE_BY_CHANNEL.reduce((a, b) => a + b.value, 0))}
                  </Typography>
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
