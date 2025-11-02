import React, { useState, useMemo, useEffect } from "react";
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
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  CircularProgress
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
  Security,
  History,
  Notifications,
  GetApp,
  Assignment,
  Star,
  AccessTime,
  ErrorOutline,
  Refresh
} from "@mui/icons-material";
import { getAllUsers, suspendUser, unsuspendUser, filterUsersByRole, type User as APIUser } from '../../api/user';

// Enhanced user type
type User = {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'staff' | 'hotel-manager' | 'admin';
  status: 'active' | 'banned' | 'pending';
  banned: boolean;
  hotelId?: number;
  hotelName?: string;
  joinDate: string;
  lastLogin?: string;
  bookingsCount?: number;
  loyaltyPoints?: number;
};



const AdminUserManagement: React.FC = () => {
  // API data state
  const [allUsers, setAllUsers] = useState<APIUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // UI state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [hotelFilter, setHotelFilter] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [showStats, setShowStats] = useState(true);

  // Menu state cho user actions
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<APIUser | null>(null);

  // Snackbar state for notifications
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, userId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedUserId(userId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUserId(null);
  };

  const handleBanToggle = async (userId: string) => {
    try {
      setActionLoading(true);
      const user = allUsers.find(u => u._id === userId || u.id === userId);

      if (user?.isBanned) {
        await unsuspendUser(userId);
        setSnackbarMessage('Đã mở khóa người dùng');
        setSnackbarSeverity('success');
      } else {
        await suspendUser(userId, { isBanned: true, banReason: 'Admin suspension' });
        setSnackbarMessage('Đã khóa người dùng');
        setSnackbarSeverity('success');
      }

      // Refresh data
      fetchUsers();

      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Có lỗi xảy ra');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = (user: APIUser) => {
    setDetailUser(user);
    setDetailModalOpen(true);
    handleMenuClose();
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId.toString())
        ? prev.filter(id => id !== userId.toString())
        : [...prev, userId.toString()]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => (user._id || user.id).toString()));
    }
  };

  const handleBulkBan = async () => {
    try {
      setActionLoading(true);

      // TODO: Implement bulk ban API call
      for (const userId of selectedUsers) {
        await suspendUser(userId, { isBanned: true, banReason: 'Bulk admin suspension' });
      }

      setSnackbarMessage(`Đã khóa ${selectedUsers.length} người dùng`);
      setSnackbarSeverity('success');
      setSelectedUsers([]);

      // Refresh data
      fetchUsers();
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Có lỗi xảy ra khi khóa người dùng');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkUnban = async () => {
    try {
      setActionLoading(true);

      // TODO: Implement bulk unban API call
      for (const userId of selectedUsers) {
        await unsuspendUser(userId);
      }

      setSnackbarMessage(`Đã mở khóa ${selectedUsers.length} người dùng`);
      setSnackbarSeverity('success');
      setSelectedUsers([]);

      // Refresh data
      fetchUsers();
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Có lỗi xảy ra khi mở khóa người dùng');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setActionLoading(false);
    }
  };

  // Fetch users function
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const usersData = await getAllUsers();
      setAllUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Có lỗi xảy ra khi tải danh sách người dùng');
      setAllUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const total = allUsers.length;
    const customers = allUsers.filter(u => u.role === 'customer').length;
    const staffShippers = allUsers.filter(u => u.role === 'staff' || u.role === 'shipper').length;
    const admins = allUsers.filter(u => u.role === 'admin').length;
    const active = allUsers.filter(u => !u.isBanned).length;
    const banned = allUsers.filter(u => u.isBanned).length;

    return {
      total,
      customers,
      employees: staffShippers, // map staff/shipper to employee for UI
      managers: 0, // backend doesn't have manager role
      admins,
      active,
      banned
    };
  }, [allUsers]);

  const filteredUsers = allUsers.filter(user => {
    const roleMatch = roleFilter === "all" ||
      (roleFilter === "staff" && (user.role === 'staff' || user.role === 'shipper')) ||
      (roleFilter === "customer" && user.role === 'customer') ||
      (roleFilter === "admin" && user.role === 'admin') ||
      (roleFilter === "hotel-manager" && user.role === 'hotel-manager'); // no manager in current backend

    const statusMatch = statusFilter === "all" ||
      (statusFilter === "active" && !user.isBanned) ||
      (statusFilter === "banned" && user.isBanned);

    const searchMatch = search === "" ||
      user.fullname?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.username?.toLowerCase().includes(search.toLowerCase());

    return roleMatch && statusMatch && searchMatch;
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

      {/* Loading/Error State */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 8 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 2 }}>Đang tải danh sách người dùng...</Typography>
        </Box>
      ) : error ? (
        <Box display="flex" flexDirection="column" alignItems="center" sx={{ py: 8 }}>
          <ErrorOutline sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
          <Typography variant="h6" color="error" gutterBottom>
            Có lỗi xảy ra khi tải dữ liệu
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={fetchUsers}
          >
            Thử lại
          </Button>
        </Box>
      ) : (
        /* Users Table */
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
                  <TableRow key={user._id || user.id} hover sx={{ transition: '0.2s', '&:hover': { background: '#f0f4ff' } }}>
                    {bulkMode && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedUsers.includes((user._id || user.id).toString())}
                          onChange={() => handleSelectUser((user._id || user.id).toString())}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{
                          bgcolor: getRoleColor(user.role === 'staff' || user.role === 'shipper' ? 'employee' : user.role),
                          width: 40,
                          height: 40,
                          opacity: user.isBanned ? 0.5 : 1
                        }}>
                          {getRoleIcon(user.role === 'staff' || user.role === 'shipper' ? 'employee' : user.role)}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={600}>{user.fullname || user.username}</Typography>
                          <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                          {user.role === 'customer' && (
                            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 500 }}>
                              Khách hàng thân thiết
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
                          user.role === 'staff' ? 'Nhân viên' :
                          user.role === 'shipper' ? 'Nhân viên' :
                          user.role === 'admin' ? 'Admin' : user.role
                        }
                        variant="outlined"
                        sx={{
                          color: getRoleColor(user.role === 'staff' || user.role === 'shipper' ? 'employee' : user.role),
                          borderColor: getRoleColor(user.role === 'staff' || user.role === 'shipper' ? 'employee' : user.role),
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Hotel sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {user.address || 'Chưa chỉ định'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Chưa đăng nhập'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={user.isBanned ? <Block /> : <CheckCircle />}
                        label={user.isBanned ? 'Bị khóa' : 'Hoạt động'}
                        color={user.isBanned ? 'error' : 'success'}
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton
                          size="small"
                          disabled={actionLoading}
                          onClick={(e) => handleMenuOpen(e, (user._id || user.id).toString())}
                          sx={{ color: 'text.secondary' }}
                        >
                          <MoreVert />
                        </IconButton>
                        <Button
                          size="small"
                          variant={user.isBanned ? "contained" : "outlined"}
                          color={user.isBanned ? "success" : "error"}
                          disabled={actionLoading}
                          onClick={() => handleBanToggle((user._id || user.id).toString())}
                          sx={{ minWidth: 70 }}
                        >
                          {user.isBanned ? "Mở khóa" : "Khóa"}
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedUserId && (() => {
          const user = allUsers.find(u => (u._id || u.id) === selectedUserId);
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
                Điểm tích lũy
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
                <Avatar sx={{ bgcolor: getRoleColor(detailUser.role === 'staff' || detailUser.role === 'shipper' ? 'employee' : detailUser.role), width: 60, height: 60 }}>
                  {getRoleIcon(detailUser.role === 'staff' || detailUser.role === 'shipper' ? 'employee' : detailUser.role)}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">{detailUser.fullname || detailUser.username}</Typography>
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
                      label={
                        detailUser.role === 'customer' ? 'Khách hàng' :
                        detailUser.role === 'staff' ? 'Nhân viên' :
                        detailUser.role === 'shipper' ? 'Nhân viên' :
                        detailUser.role === 'admin' ? 'Admin' : detailUser.role
                      }
                      color={getRoleColor(detailUser.role === 'staff' || detailUser.role === 'shipper' ? 'employee' : detailUser.role) as any}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Trạng thái</Typography>
                    <Chip
                      label={detailUser.isBanned ? 'Bị khóa' : 'Hoạt động'}
                      color={detailUser.isBanned ? 'error' : 'success'}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Địa chỉ</Typography>
                    <Typography variant="body1">{detailUser.address || 'Chưa cập nhật'}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1">{detailUser.phone || 'Chưa cập nhật'}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Thống kê
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Ngày tham gia</Typography>
                    <Typography variant="body1">
                      {detailUser.createdAt ? new Date(detailUser.createdAt).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Cập nhật cuối</Typography>
                    <Typography variant="body1">
                      {detailUser.updatedAt ? new Date(detailUser.updatedAt).toLocaleDateString('vi-VN') : 'Chưa xác định'}
                    </Typography>
                  </Box>
                  {detailUser.role === 'customer' && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Khách hàng thân thiết</Typography>
                      <Typography variant="body1">✓</Typography>
                    </Box>
                  )}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Trạng thái tài khoản</Typography>
                    <Typography variant="body1" color={detailUser.isBanned ? 'error.main' : 'success.main'}>
                      {detailUser.isBanned ? 'Đã bị khóa' : 'Đang hoạt động'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailModalOpen(false)}>Đóng</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminUserManagement;
