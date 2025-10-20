import React, { useState, useMemo } from "react";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  IconButton,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Grid,
  Switch,
  FormControlLabel
} from "@mui/material";
import {
  Person,
  Search,
  Block,
  CheckCircle,
  MoreVert,
  Business,
  People,
  Hotel,
  CardMembership,
  Security,
  History,
  Notifications,
  GetApp,
  Group,
  Assignment,
  Star,
  AccessTime
} from "@mui/icons-material";

// Enhanced user type
type User = {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'employee' | 'manager' | 'admin';
  status: 'active' | 'banned' | 'pending';
  banned: boolean;
  hotelId?: number;
  hotelName?: string;
  joinDate: string;
  lastLogin?: string;
  bookingsCount?: number;
  loyaltyPoints?: number;
};

const initialUsers: User[] = [
  {
    id: 1,
    name: "Alice Smith",
    email: "alice@example.com",
    role: 'customer',
    status: 'active',
    banned: false,
    hotelId: 1,
    hotelName: 'Grande Hotel Saigon',
    joinDate: '2023-01-15',
    lastLogin: '2025-10-16',
    bookingsCount: 12,
    loyaltyPoints: 1200
  },
  {
    id: 2,
    name: "Bob Johnson",
    email: "bob@example.com",
    role: 'customer',
    status: 'banned',
    banned: true,
    hotelId: 2,
    hotelName: 'Grande Hotel Hanoi',
    joinDate: '2023-03-20',
    lastLogin: '2025-09-15',
    bookingsCount: 8,
    loyaltyPoints: 800
  },
  {
    id: 3,
    name: "Charlie Lee",
    email: "charlie@example.com",
    role: 'employee',
    status: 'active',
    banned: false,
    hotelId: 1,
    hotelName: 'Grande Hotel Saigon',
    joinDate: '2023-06-10',
    lastLogin: '2025-10-16',
    bookingsCount: 0,
    loyaltyPoints: 0
  },
  {
    id: 4,
    name: "David Manager",
    email: "david@grandehotel.vn",
    role: 'manager',
    status: 'active',
    banned: false,
    hotelId: 3,
    hotelName: 'Grande Hotel Da Nang',
    joinDate: '2022-11-01',
    lastLogin: '2025-10-16',
    bookingsCount: 0,
    loyaltyPoints: 0
  },
  {
    id: 5,
    name: "Eva Nguyen",
    email: "eva.staff@grandehotel.vn",
    role: 'employee',
    status: 'active',
    banned: false,
    hotelId: 4,
    hotelName: 'Grande Hotel Nha Trang',
    joinDate: '2024-01-20',
    lastLogin: '2025-10-16',
    bookingsCount: 0,
    loyaltyPoints: 0
  },
  {
    id: 6,
    name: "Frank Wilson",
    email: "fr-wilson@outlook.com",
    role: 'customer',
    status: 'active',
    banned: false,
    hotelId: 5,
    hotelName: 'Grande Hotel Airport',
    joinDate: '2024-03-15',
    lastLogin: '2025-10-10',
    bookingsCount: 3,
    loyaltyPoints: 300
  },
  {
    id: 7,
    name: "Grace Admin",
    email: "admin@grandehotel.vn",
    role: 'admin',
    status: 'active',
    banned: false,
    joinDate: '2021-01-01',
    lastLogin: '2025-10-16',
    bookingsCount: 0,
    loyaltyPoints: 0
  },
];

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [hotelFilter, setHotelFilter] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [showStats, setShowStats] = useState(true);

  // Menu state cho user actions
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<User | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, userId: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedUserId(userId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUserId(null);
  };

  const handleBanToggle = (id: number) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id ? {
          ...user,
          banned: !user.banned,
          status: !user.banned ? 'banned' : 'active'
        } : user
      )
    );
  };

  const handleViewDetails = (user: User) => {
    setDetailUser(user);
    setDetailModalOpen(true);
    handleMenuClose();
  };

  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleBulkBan = () => {
    setUsers(prev => prev.map(user =>
      selectedUsers.includes(user.id)
        ? { ...user, banned: true, status: 'banned' as const }
        : user
    ));
    setSelectedUsers([]);
  };

  const handleBulkUnban = () => {
    setUsers(prev => prev.map(user =>
      selectedUsers.includes(user.id)
        ? { ...user, banned: false, status: 'active' as const }
        : user
    ));
    setSelectedUsers([]);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = users.length;
    const customers = users.filter(u => u.role === 'customer').length;
    const employees = users.filter(u => u.role === 'employee').length;
    const managers = users.filter(u => u.role === 'manager').length;
    const admins = users.filter(u => u.role === 'admin').length;
    const active = users.filter(u => u.status === 'active').length;
    const banned = users.filter(u => u.status === 'banned').length;

    return {
      total,
      customers,
      employees,
      managers,
      admins,
      active,
      banned
    };
  }, [users]);

  const filteredUsers = users.filter(user => {
    const roleMatch = roleFilter === "all" || user.role === roleFilter;
    const statusMatch = statusFilter === "all" || user.status === statusFilter;
    const hotelMatch = hotelFilter === "all" ||
      (user.hotelId ? user.hotelId.toString() === hotelFilter : hotelFilter === "none");
    const searchMatch = search === "" ||
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());

    return roleMatch && statusMatch && hotelMatch && searchMatch;
  });

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'customer': return <Person />;
      case 'employee': return <Assignment />;
      case 'manager': return <Business />;
      case 'admin': return <Security />;
      default: return <Person />;
    }
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'customer': return 'primary.main';
      case 'employee': return 'info.main';
      case 'manager': return 'warning.main';
      case 'admin': return 'error.main';
      default: return 'grey.500';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return { color: 'success', label: 'Hoạt động' };
      case 'banned': return { color: 'error', label: 'Bị khóa' };
      case 'pending': return { color: 'warning', label: 'Chờ duyệt' };
      default: return { color: 'default', label: 'Unknown' };
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom fontWeight={700} color="primary.main">
          Quản lý người dùng - Chuỗi Grande Hotel
        </Typography>
        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<GetApp />}>
            Xuất dữ liệu
          </Button>
          <FormControlLabel
            control={
              <Switch
                checked={showStats}
                onChange={(e) => setShowStats(e.target.checked)}
              />
            }
            label="Thống kê"
          />
        </Box>
      </Box>

      {/* Statistics Cards */}
      {showStats && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
          <Card sx={{ boxShadow: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <People sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">{stats.total}</Typography>
              <Typography variant="body2" color="text.secondary">Tổng người dùng</Typography>
            </CardContent>
          </Card>
          <Card sx={{ boxShadow: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Person sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">{stats.customers}</Typography>
              <Typography variant="body2" color="text.secondary">Khách hàng</Typography>
            </CardContent>
          </Card>
          <Card sx={{ boxShadow: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Assignment sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">{stats.employees}</Typography>
              <Typography variant="body2" color="text.secondary">Nhân viên</Typography>
            </CardContent>
          </Card>
          <Card sx={{ boxShadow: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="bold">{stats.active}</Typography>
              <Typography variant="body2" color="text.secondary">Hoạt động</Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Filters */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, alignItems: 'center' }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Tìm kiếm tên hoặc email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 250, borderRadius: 2 }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={roleFilter}
            label="Role"
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="customer">Khách hàng</MenuItem>
            <MenuItem value="employee">Nhân viên</MenuItem>
            <MenuItem value="manager">Quản lý</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Trạng thái</InputLabel>
          <Select
            value={statusFilter}
            label="Trạng thái"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="active">Hoạt động</MenuItem>
            <MenuItem value="banned">Bị khóa</MenuItem>
            <MenuItem value="pending">Chờ duyệt</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Khách sạn</InputLabel>
          <Select
            value={hotelFilter}
            label="Khách sạn"
            onChange={(e) => setHotelFilter(e.target.value)}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="1">Grande Saigon</MenuItem>
            <MenuItem value="2">Grande Hanoi</MenuItem>
            <MenuItem value="3">Grande Da Nang</MenuItem>
            <MenuItem value="4">Grande Nha Trang</MenuItem>
            <MenuItem value="5">Grande Airport</MenuItem>
            <MenuItem value="none">Chưa chỉ định</MenuItem>
          </Select>
        </FormControl>
        <Box display="flex" gap={1} alignItems="center">
          <FormControlLabel
            control={
              <Checkbox
                checked={bulkMode}
                onChange={(e) => setBulkMode(e.target.checked)}
              />
            }
            label="Chọn nhiều"
          />
          {bulkMode && selectedUsers.length > 0 && (
            <>
              <Button size="small" variant="contained" color="error" onClick={handleBulkBan}>
                Khóa {selectedUsers.length} người
              </Button>
              <Button size="small" variant="contained" color="success" onClick={handleBulkUnban}>
                Mở khóa {selectedUsers.length} người
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Users Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3 }}>
        <Table>
          <TableHead sx={{ background: "#f5f7fa" }}>
            <TableRow>
              {bulkMode && (
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    indeterminate={selectedUsers.length > 0 && selectedUsers.length < filteredUsers.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
              <TableCell>Người dùng</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Khách sạn</TableCell>
              <TableCell>Đăng nhập cuối</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={bulkMode ? 8 : 7} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                  <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                    <Search sx={{ fontSize: 48, color: 'text.disabled' }} />
                    <Typography variant="h6">Không tìm thấy người dùng nào</Typography>
                    <Typography variant="body2">Thử thay đổi bộ lọc tìm kiếm</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} hover sx={{ transition: '0.2s', '&:hover': { background: '#f0f4ff' } }}>
                  {bulkMode && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{
                        bgcolor: getRoleColor(user.role),
                        width: 40,
                        height: 40,
                        opacity: user.banned ? 0.5 : 1
                      }}>
                        {getRoleIcon(user.role)}
                      </Avatar>
                      <Box>
                        <Typography fontWeight={600}>{user.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                        {user.bookingsCount !== undefined && user.bookingsCount > 0 && (
                          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 500 }}>
                            {user.bookingsCount} bookings
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={
                        user.role === 'customer' ? 'Khách hàng' :
                        user.role === 'employee' ? 'Nhân viên' :
                        user.role === 'manager' ? 'Quản lý' : 'Admin'
                      }
                      variant="outlined"
                      sx={{
                        color: getRoleColor(user.role),
                        borderColor: getRoleColor(user.role),
                        fontWeight: 600,
                        textTransform: 'capitalize'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Hotel sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {user.hotelName || 'Chưa chỉ định'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {user.lastLogin || 'Chưa đăng nhập'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={user.status === 'active' ? <CheckCircle /> : user.status === 'banned' ? <Block /> : <Star />}
                      label={getStatusColor(user.status).label}
                      color={getStatusColor(user.status).color as any}
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, user.id)}
                        sx={{ color: 'text.secondary' }}
                      >
                        <MoreVert />
                      </IconButton>
                      <Button
                        size="small"
                        variant={user.banned ? "contained" : "outlined"}
                        color={user.banned ? "success" : "error"}
                        onClick={() => handleBanToggle(user.id)}
                        sx={{ minWidth: 70 }}
                      >
                        {user.banned ? "Mở khóa" : "Khóa"}
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedUserId && (() => {
          const user = users.find(u => u.id === selectedUserId);
          if (!user) return null;

          return [
            <MenuItem key="view" onClick={() => handleViewDetails(user)}>
              <Person sx={{ mr: 1 }} />
              Xem chi tiết
            </MenuItem>,
            user.role === 'customer' && (
              <MenuItem key="booking-history" onClick={handleMenuClose}>
                <History sx={{ mr: 1 }} />
                Lịch sử đặt phòng
              </MenuItem>
            ),
            user.role === 'customer' && (
              <MenuItem key="loyalty" onClick={handleMenuClose}>
                <Star sx={{ mr: 1 }} />
                Điểm tích lũy: {user.loyaltyPoints}
              </MenuItem>
            ),
            user.role !== 'admin' && (
              <MenuItem key="notifications" onClick={handleMenuClose}>
                <Notifications sx={{ mr: 1 }} />
                Gửi thông báo
              </MenuItem>
            )
          ].filter(Boolean);
        })()}
      </Menu>

      {/* User Detail Modal */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {detailUser && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: getRoleColor(detailUser.role), width: 60, height: 60 }}>
                  {getRoleIcon(detailUser.role)}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">{detailUser.name}</Typography>
                  <Typography variant="body1" color="text.secondary">{detailUser.email}</Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Tabs value={0} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tab label="Thông tin cơ bản" />
                <Tab label="Hoạt động" />
                <Tab label="Quyền & Vai trò" />
              </Tabs>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Thông tin cá nhân
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Role</Typography>
                    <Chip
                      label={detailUser.role === 'customer' ? 'Khách hàng' : detailUser.role === 'employee' ? 'Nhân viên' : 'Quản lý'}
                      color={getRoleColor(detailUser.role) as any}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Trạng thái</Typography>
                    <Chip
                      label={getStatusColor(detailUser.status).label}
                      color={getStatusColor(detailUser.status).color as any}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Khách sạn</Typography>
                    <Typography variant="body1">{detailUser.hotelName || 'Chưa chỉ định'}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Thống kê
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Ngày tham gia</Typography>
                    <Typography variant="body1">{detailUser.joinDate}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Đăng nhập cuối</Typography>
                    <Typography variant="body1">{detailUser.lastLogin || 'Chưa đăng nhập'}</Typography>
                  </Box>
                  {detailUser.bookingsCount !== undefined && detailUser.bookingsCount > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Số lần đặt phòng</Typography>
                      <Typography variant="body1">{detailUser.bookingsCount} lần</Typography>
                    </Box>
                  )}
                  {detailUser.loyaltyPoints !== undefined && detailUser.loyaltyPoints > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Điểm tích lũy</Typography>
                      <Typography variant="body1">{detailUser.loyaltyPoints} điểm</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailModalOpen(false)}>Đóng</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AdminUserManagement;
