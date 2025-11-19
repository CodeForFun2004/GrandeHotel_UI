import { useMemo, useState, useEffect } from "react";
import { Box, Card, CardContent, Typography, ToggleButton, ToggleButtonGroup, Divider, LinearProgress, List, ListItem, ListItemText, Button, CircularProgress } from "@mui/material";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import { formatVND } from "../../utils/formatCurrency";
import {
  getManagerKPIs,
  getManagerRevenueSeries,
  getManagerBookingStatus,
  getManagerTopServices,
  type KPIData,
  type RevenueSeriesItem,
  type BookingStatusItem,
  type TopServiceItem,
} from "../../api/dashboard";

export default function ManagerDashboard() {
  const [groupBy, setGroupBy] = useState<"day" | "month">("day");
  const [from, setFrom] = useState<Date | null>(new Date());
  const [to, setTo] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [kpi, setKpi] = useState<KPIData>({
    totalBookings: 0,
    revenue: 0,
    occupancy: 0,
    adr: 0,
  });
  const [revenueSeries, setRevenueSeries] = useState<RevenueSeriesItem[]>([]);
  const [bookingStatus, setBookingStatus] = useState<BookingStatusItem[]>([]);
  const [topServices, setTopServices] = useState<TopServiceItem[]>([]);

  const totalRevenue = useMemo(() => revenueSeries.reduce((s, d) => s + d.value, 0), [revenueSeries]);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        setRefreshing(true);
        const fromStr = from ? from.toISOString().split('T')[0] : undefined;
        const toStr = to ? to.toISOString().split('T')[0] : undefined;

        const params = {
          from: fromStr,
          to: toStr,
          groupBy,
        };

        const [kpiRes, revenueRes, statusRes, servicesRes] = await Promise.all([
          getManagerKPIs({ from: fromStr, to: toStr }),
          getManagerRevenueSeries(params),
          getManagerBookingStatus({ from: fromStr, to: toStr }),
          getManagerTopServices({ from: fromStr, to: toStr }),
        ]);

        if (!isMounted) return;

        if (kpiRes?.success && kpiRes.data) setKpi(kpiRes.data);
        if (revenueRes?.success && revenueRes.data) setRevenueSeries(revenueRes.data);
        if (statusRes?.success && statusRes.data) setBookingStatus(statusRes.data);
        if (servicesRes?.success && servicesRes.data) setTopServices(servicesRes.data);
      } catch (error: any) {
        if (!isMounted) return;
        console.error("Error loading dashboard data:", error);
        toast.error(error.response?.data?.message || "Không thể tải dữ liệu dashboard");
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [groupBy, from, to]);

  const handleRefresh = () => {
    setLoading(true);
    const fromStr = from ? from.toISOString().split('T')[0] : undefined;
    const toStr = to ? to.toISOString().split('T')[0] : undefined;

    const params = {
      from: fromStr,
      to: toStr,
      groupBy,
    };

    Promise.all([
      getManagerKPIs({ from: fromStr, to: toStr }),
      getManagerRevenueSeries(params),
      getManagerBookingStatus({ from: fromStr, to: toStr }),
      getManagerTopServices({ from: fromStr, to: toStr }),
    ])
      .then(([kpiRes, revenueRes, statusRes, servicesRes]) => {
        if (kpiRes?.success && kpiRes.data) setKpi(kpiRes.data);
        if (revenueRes?.success && revenueRes.data) setRevenueSeries(revenueRes.data);
        if (statusRes?.success && statusRes.data) setBookingStatus(statusRes.data);
        if (servicesRes?.success && servicesRes.data) setTopServices(servicesRes.data);
      })
      .catch((error: any) => {
        console.error("Error loading dashboard data:", error);
        toast.error(error.response?.data?.message || "Không thể tải dữ liệu dashboard");
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
        <ToggleButtonGroup
          exclusive
          value={groupBy}
          onChange={(_, v) => v && setGroupBy(v)}
          size="small"
        >
          <ToggleButton value="day">THEO NGÀY</ToggleButton>
          <ToggleButton value="month">THEO THÁNG</ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <DatePicker selected={from} onChange={setFrom} className="form-control" />
          <span>–</span>
          <DatePicker selected={to} onChange={setTo} className="form-control" />
        </Box>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? <CircularProgress size={16} /> : "LÀM MỚI"}
        </Button>
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
            <Typography variant="h4" sx={{ mt: 1 }}>{formatVND(kpi.revenue)}</Typography>
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
            <Typography variant="h4" sx={{ mt: 1 }}>{formatVND(kpi.adr)}</Typography>
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
                <ListItem key={i} secondaryAction={<Typography>{formatVND(d.value)}</Typography>}>
                  <ListItemText primary={d.label} />
                </ListItem>
              ))}
              <Divider />
              <ListItem secondaryAction={<Typography fontWeight={600}>{formatVND(totalRevenue)}</Typography>}>
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
            {topServices.length > 0 ? (
              topServices.map((s) => (
                <Card key={s.name} variant="outlined">
                  <CardContent>
                    <Typography>{s.name}</Typography>
                    <Typography color="text.secondary">{formatVND(s.revenue)}</Typography>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Typography color="text.secondary">Chưa có dữ liệu dịch vụ</Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
} 