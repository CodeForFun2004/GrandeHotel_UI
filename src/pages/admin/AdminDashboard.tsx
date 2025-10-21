
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../redux/store';
import { formatVNDAbbreviated } from '../../utils/formatCurrency';
import {
  fetchDashboardStats,
  fetchRevenueData,
  fetchHotelPerformance,
  fetchBookingStatus,
  fetchUserStats
} from '../../redux/slices/dashboardSlice';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Business,
  People,
  Room,
  TrendingUp,
  Warning,
  CheckCircle,
  Hotel,
  Person,
  Receipt,
  AccessTime
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';


const AdminDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    stats,
    revenueData,
    hotelPerformance,
    bookingStatus,
    userStats,
    loading,
    error
  } = useSelector((state: RootState) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchRevenueData());
    dispatch(fetchHotelPerformance());
    dispatch(fetchBookingStatus());
    dispatch(fetchUserStats());
  }, [dispatch]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
        Admin Dashboard - Chuỗi Khách sạn Grande
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <Card sx={{ boxShadow: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                  Tổng Khách sạn
                </Typography>
                <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold' }}>
                  {stats.totalHotels}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <Business />
              </Avatar>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ boxShadow: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                  Tổng Phòng
                </Typography>
                <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold' }}>
                  {stats.totalRooms}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'success.main' }}>
                <Room />
              </Avatar>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ boxShadow: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                  Tổng Người dùng
                </Typography>
                <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold' }}>
                  {stats.totalUsers}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'info.main' }}>
                <People />
              </Avatar>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ boxShadow: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                  Doanh thu Tháng
                </Typography>
              <Typography variant="h4" sx={{ mt: 1, fontWeight: 'bold' }}>
                  {formatVNDAbbreviated(stats.totalRevenue)}
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'warning.main' }}>
                <TrendingUp />
              </Avatar>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3, mb: 3 }}>
        <Card sx={{ boxShadow: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Doanh thu 6 tháng gần nhất
            </Typography>
            <Box sx={{ height: 300 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatVNDAbbreviated(value)} />
                    <Tooltip
                      formatter={(value) => [formatVNDAbbreviated(Number(value)), 'Doanh thu']}
                      labelFormatter={(label) => `Tháng: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#1976d2"
                      strokeWidth={3}
                      name="Doanh thu"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ boxShadow: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Trạng thái Đặt phòng
            </Typography>
            <Box sx={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bookingStatus as any[]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    {bookingStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
        <Card sx={{ boxShadow: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Hiệu suất Khách sạn (Top 5)
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Khách sạn</TableCell>
                    <TableCell align="right">Doanh thu</TableCell>
                    <TableCell align="center">Tỷ lệ lấp đầy</TableCell>
                    <TableCell align="center">Trạng thái</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hotelPerformance.map((hotel) => (
                    <TableRow key={hotel.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            <Hotel sx={{ fontSize: 16 }} />
                          </Avatar>
                          <Typography variant="body2" fontWeight="medium">
                            {hotel.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {formatVNDAbbreviated(hotel.revenue)}
                      </TableCell>
                      <TableCell align="center">
                        <Box>
                          <Typography variant="body2">{hotel.occupancy}%</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={hotel.occupancy}
                            sx={{ width: 60, height: 4, mt: 0.5 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={hotel.status}
                          color={hotel.status === 'Active' ? 'success' : 'warning'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Card sx={{ boxShadow: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Thống kê Người dùng
            </Typography>
            <Box sx={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userStats as any[]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="role" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1976d2" name="Tổng số" />
                  <Bar dataKey="newThisMonth" fill="#82ca9d" name="Mới tháng này" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>

        <Card sx={{ boxShadow: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Hành động Nhanh
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button variant="contained" startIcon={<Business />}>
                Quản lý Khách sạn
              </Button>
              <Button variant="contained" startIcon={<People />} color="secondary">
                Quản lý Người dùng
              </Button>
              <Button variant="contained" startIcon={<Room />} color="success">
                Quản lý Phòng
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
