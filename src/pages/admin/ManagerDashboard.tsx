import { useMemo, useState } from "react";
import { Box, Card, CardContent, Typography, ToggleButton, ToggleButtonGroup, Divider, LinearProgress, List, ListItem, ListItemText, Button } from "@mui/material";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Mock data generators
const makeKpi = (range: string) => ({
  totalBookings: range === "month" ? 420 : 68,
  revenue: range === "month" ? 84500 : 12600,
  occupancy: range === "month" ? 78 : 74,
  adr: range === "month" ? 120 : 116,
});

const makeRevenueSeries = (range: string) => {
  const len = range === "month" ? 12 : 7;
  return Array.from({ length: len }, (_, i) => ({
    label: range === "month" ? `T${i + 1}` : `D${i + 1}`,
    value: Math.round(2000 + Math.random() * 9000),
  }));
};

const bookingStatus = [
  { status: "Approved", value: 32 },
  { status: "Pending", value: 9 },
  { status: "Rejected", value: 4 },
  { status: "Checked-in", value: 15 },
  { status: "Checked-out", value: 8 },
];

const topServices = [
  { name: "Spa", revenue: 5200 },
  { name: "Restaurant", revenue: 3900 },
  { name: "Airport Pickup", revenue: 1800 },
  { name: "Laundry", revenue: 950 },
  { name: "Mini Bar", revenue: 600 },
];

export default function ManagerDashboard() {
  const [groupBy, setGroupBy] = useState<"day" | "month">("day");
  const [from, setFrom] = useState<Date | null>(new Date());
  const [to, setTo] = useState<Date | null>(new Date());

  const kpi = useMemo(() => makeKpi(groupBy), [groupBy]);
  const revenueSeries = useMemo(() => makeRevenueSeries(groupBy), [groupBy]);

  const totalRevenue = revenueSeries.reduce((s, d) => s + d.value, 0);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
        <ToggleButtonGroup
          exclusive
          value={groupBy}
          onChange={(_, v) => v && setGroupBy(v)}
          size="small"
        >
          <ToggleButton value="day">Theo ngày</ToggleButton>
          <ToggleButton value="month">Theo tháng</ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <DatePicker selected={from} onChange={setFrom} className="form-control" />
          <span>–</span>
          <DatePicker selected={to} onChange={setTo} className="form-control" />
        </Box>
        <Button variant="outlined" size="small">Làm mới</Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        <Card>
          <CardContent>
            <Typography variant="overline" color="text.secondary">Total Bookings</Typography>
            <Typography variant="h4" sx={{ mt: 1 }}>{kpi.totalBookings}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="overline" color="text.secondary">Revenue</Typography>
            <Typography variant="h4" sx={{ mt: 1 }}>${kpi.revenue.toLocaleString()}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="overline" color="text.secondary">Occupancy</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
              <Box sx={{ flexGrow: 1 }}>
                <LinearProgress variant="determinate" value={kpi.occupancy} />
              </Box>
              <Typography variant="h6">{kpi.occupancy}%</Typography>
            </Box>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="overline" color="text.secondary">ADR</Typography>
            <Typography variant="h4" sx={{ mt: 1 }}>${kpi.adr}</Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <Card>
          <CardContent>
            <Typography variant="h6">Doanh thu ({groupBy === "day" ? "7 ngày" : "12 tháng"})</Typography>
            <Divider sx={{ my: 2 }} />
            <List dense>
              {revenueSeries.map((d, i) => (
                <ListItem key={i} secondaryAction={<Typography>${d.value.toLocaleString()}</Typography>}>
                  <ListItemText primary={d.label} />
                </ListItem>
              ))}
              <Divider />
              <ListItem secondaryAction={<Typography fontWeight={600}>${totalRevenue.toLocaleString()}</Typography>}>
                <ListItemText primary={<Typography fontWeight={600}>Tổng</Typography>} />
              </ListItem>
            </List>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6">Booking theo trạng thái</Typography>
            <Divider sx={{ my: 2 }} />
            <List dense>
              {bookingStatus.map((b) => (
                <ListItem key={b.status} secondaryAction={<Typography>{b.value}</Typography>}>
                  <ListItemText primary={b.status} />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6">Top dịch vụ</Typography>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            {topServices.map((s) => (
              <Card key={s.name} variant="outlined">
                <CardContent>
                  <Typography>{s.name}</Typography>
                  <Typography color="text.secondary">${s.revenue.toLocaleString()}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
} 