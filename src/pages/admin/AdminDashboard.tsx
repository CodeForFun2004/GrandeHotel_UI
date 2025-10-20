
import React, { useMemo } from 'react';
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
  Divider
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

// Mock data cho dashboard
const mockRevenueData = [
  { month: 'T1', revenue: 125000, bookings: 145 },
  { month: 'T2', revenue: 158000, bookings: 167 },
  { month: 'T3', revenue: 142000, bookings: 159 },
  { month: 'T4', revenue: 189000, bookings: 201 },
  { month: 'T5', revenue: 167000, bookings: 183 },
  { month: 'T6', revenue: 195000, bookings: 215 },
];

const mockHotelPerformance = [
  { id: 1, name: 'Grande Hotel Saigon', revenue: 45000, occupancy: 85, status: 'Active' },
  { id: 2, name: 'Grande Hotel Hanoi', revenue: 38000, occupancy: 78, status: 'Active' },
  { id: 3, name: 'Grande Hotel Da Nang', revenue: 32000, occupancy: 72, status: 'Active' },
  { id: 4, name: 'Grande Hotel HCMC Airport', revenue: 28000, occupancy: 68, status: 'Maintenance' },
  { id: 5, name: 'Grande Hotel Nha Trang', revenue: 25000, occupancy: 65, status: 'Active' },
];

const mockBookingStatus = [
  { name: 'Đã duyệt', value: 45, color: '#4CAF50' },
  { name: 'Đang chờ', value: 28, color: '#FF9800' },
  { name: 'Đã hủy', value: 15, color: '#F44336' },
  { name: 'Đã check-in', value: 12, color: '#2196F3' },
];

const mockUserStats = [
  { role: 'Khách hàng', count: 1250, newThisMonth: 45 },
  { role: 'Nhân viên', count: 320, newThisMonth: 8 },
  { role: 'Quản lý', count: 25, newThisMonth: 1 },
];

const mockRecentActivities = [
  { type: 'booking', message: 'Đặt phòng mới tại Grande Hotel Saigon', time: '2 phút trước', user: 'John Doe' },
  { type: 'user', message: 'Tài khoản mới đăng ký', time: '10 phút trước', user: 'Jane Smith' },
  { type: 'payment', message: 'Thanh toán thành công', time: '1 giờ trước', user: 'Mike Wilson' },
  { type: 'room', message: 'Phòng A101 được cập nhật', time: '2 giờ trước', user: 'Manager Nguyễn' },
  { type: 'alert', message: 'Khách sạn Da Nang cần bảo trì', time: '3 giờ trước', user: 'System' },
];

const AdminDashboard: React.FC = () => {
  const stats = useMemo(() => ({
    totalHotels: 5,
    totalRooms: 1200,
    totalUsers: 1595,
    totalRevenue: 976000,
  }), []);

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
                  ${stats.totalRevenue.toLocaleString()}
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
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#1976d2"
                    strokeWidth={3}
                    name="Doanh thu"
                  />
                </LineChart>
              </ResponsiveContainer>
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
                    data={mockBookingStatus}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    {mockBookingStatus.map((entry, index) => (
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
                  {mockHotelPerformance.map((hotel) => (
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
                        ${hotel.revenue.toLocaleString()}
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
                <BarChart data={mockUserStats}>
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
