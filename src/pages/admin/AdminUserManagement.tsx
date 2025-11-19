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
  Hotel as HotelIcon,
  Security,
  History,
  Notifications,
  GetApp,
  Assignment,
  Star,
  AccessTime,
  ErrorOutline,
  Refresh,
  Edit,
  Save
} from "@mui/icons-material";
import { getAllUsers, suspendUser, unsuspendUser, updateUser, type User as APIUser } from '../../api/user';
import { getAllHotels } from '../../api/hotel';
import { getAllReservations, getReservationsByUser } from '../../api/reservation';
import type { Hotel, Reservation } from '../../types/entities.d';



const AdminUserManagement: React.FC = () => {
  // API data state
  const [allUsers, setAllUsers] = useState<APIUser[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [userReservations, setUserReservations] = useState<Reservation[]>([]);
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
  const [userReservationsLoading, setUserReservationsLoading] = useState(false);

  // Menu state cho user actions
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<APIUser | null>(null);
  const [detailTabValue, setDetailTabValue] = useState(0);
  const [roleEditMode, setRoleEditMode] = useState(false);
  const [newRole, setNewRole] = useState<string>('');

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
    setDetailTabValue(0);
    setRoleEditMode(false);
    setDetailModalOpen(true);
    handleMenuClose();
  };

  const handleTabChange = async (_event: React.SyntheticEvent, newValue: number) => {
    setDetailTabValue(newValue);
    setRoleEditMode(false);

    // Fetch user reservations when entering activity tab for customers
    if (newValue === 1 && detailUser && detailUser.role === 'customer') {
      setUserReservationsLoading(true);
      try {
        const userId = (detailUser._id || detailUser.id)?.toString();
        if (userId) {
          const response = await getReservationsByUser(userId);
          setUserReservations(Array.isArray(response.reservations) ? response.reservations : []);
        }
      } catch (error) {
        console.error('Error fetching user reservations:', error);
        setUserReservations([]);
      } finally {
        setUserReservationsLoading(false);
      }
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setActionLoading(true);
      await updateUser(userId, { role: newRole });

      // Update local state
      setAllUsers(prev => prev.map(user =>
        (user._id === userId || user.id === userId) ? { ...user, role: newRole as any } : user
      ));

      // Update detailUser if it's currently open
      if (detailUser && (detailUser._id === userId || detailUser.id === userId)) {
        setDetailUser(prev => prev ? { ...prev, role: newRole as any } : null);
      }

      setSnackbarMessage('Đã cập nhật vai trò thành công');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Reset edit mode
      setRoleEditMode(false);
      setNewRole('');
    } catch (error) {
      console.error('Error updating role:', error);
      setSnackbarMessage('Có lỗi xảy ra khi cập nhật vai trò');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setActionLoading(false);
    }
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
      setSelectedUsers(filteredUsers.filter(user => user._id || user.id).map(user => (user._id || user.id).toString()));
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

  // Fetch hotels function
  const fetchHotels = async () => {
    try {
      const hotelData = await getAllHotels({ limit: 100 });
      const hotelsArray = (hotelData && hotelData.results) ? hotelData.results : [];
      setHotels(Array.isArray(hotelsArray) ? hotelsArray : []);
    } catch (error) {
      console.error('Error fetching hotels:', error);
      setHotels([]);
    }
  };

  // Fetch reservations function
  const fetchReservations = async () => {
    try {
      const reservationsData = await getAllReservations();
      setAllReservations(Array.isArray(reservationsData) ? reservationsData : []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      setAllReservations([]);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
    fetchHotels();
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const total = allUsers.length;
    const customers = allUsers.filter(u => u.role === 'customer').length;
    const staff = allUsers.filter(u => u.role === 'staff' || u.role === 'shipper').length;
    const managers = allUsers.filter(u => u.role === 'hotel-manager').length;
    const admins = allUsers.filter(u => u.role === 'admin').length;
    const active = allUsers.filter(u => !u.isBanned).length;
    const banned = allUsers.filter(u => u.isBanned).length;

    return {
      total,
      customers,
      employees: staff,
      managers,
      admins,
      active,
      banned
    };
  }, [allUsers]);

  // Helper function to get hotel name by ID
  const getHotelName = (hotelId?: string) => {
    if (!hotelId) return 'Chưa chỉ định';
    const hotel = hotels.find(h => h._id?.toString() === hotelId || h.id?.toString() === hotelId);
    return hotel?.name || `Hotel ${hotelId}`;
  };

  const filteredUsers = allUsers.filter(user => {
    // Must have an ID to display
    if (!user._id && !user.id) return false;

    // Role filter - match actual API roles
    const roleMatch = roleFilter === "all" ||
      (roleFilter === "customer" && user.role === 'customer') ||
      (roleFilter === "staff" && (user.role === 'staff' || user.role === 'shipper')) ||
      (roleFilter === "admin" && user.role === 'admin') ||
      (roleFilter === "hotel-manager" && user.role === 'hotel-manager');

    // Status filter
    const statusMatch = statusFilter === "all" ||
      (statusFilter === "active" && !user.isBanned) ||
      (statusFilter === "banned" && user.isBanned);

    // Hotel filter - only apply for staff and hotel-manager roles
    // For other roles, hotel filter always matches (no restriction)
    const isStaffOrManager = user.role === 'staff' || user.role === 'shipper' || user.role === 'hotel-manager';
    const hotelMatch = !isStaffOrManager ||
      hotelFilter === "all" ||
      (hotelFilter === "none" && !user.hotelId) ||
      (hotelFilter !== "none" && hotelFilter !== "all" && user.hotelId?.toString() === hotelFilter);

    // Search filter
    const searchMatch = search === "" ||
      user.fullname?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.username?.toLowerCase().includes(search.toLowerCase());

    return roleMatch && statusMatch && hotelMatch && searchMatch;
  });

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'customer': return <Person />;
      case 'staff':
      case 'shipper': return <Assignment />;
      case 'hotel-manager': return <Business />;
      case 'admin': return <Security />;
      default: return <Person />;
    }
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'customer': return 'primary.main';
      case 'staff':
      case 'shipper': return 'info.main';
      case 'hotel-manager': return 'warning.main';
      case 'admin': return 'error.main';
      default: return 'grey.500';
    }
  };

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'customer': return 'Khách hàng';
      case 'staff': return 'Nhân viên';
      case 'shipper': return 'Nhân viên';
      case 'hotel-manager': return 'Quản lý khách sạn';
      case 'admin': return 'Admin';
      default: return role;
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
            <MenuItem value="staff">Nhân viên</MenuItem>
            <MenuItem value="hotel-manager">Quản lý khách sạn</MenuItem>
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
        {/* Hotel filter - only show for staff and hotel-manager roles */}
        {roleFilter !== 'customer' && roleFilter !== 'admin' && (
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Khách sạn</InputLabel>
            <Select
              value={hotelFilter}
              label="Khách sạn"
              onChange={(e) => setHotelFilter(e.target.value)}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              {hotels.filter(h => (h._id || h.id)).map((hotel) => (
                <MenuItem key={hotel._id || hotel.id} value={(hotel._id || hotel.id)?.toString() || ''}>
                  {hotel.name}
                </MenuItem>
              ))}
              <MenuItem value="none">Chưa chỉ định</MenuItem>
            </Select>
          </FormControl>
        )}
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
                          bgcolor: getRoleColor(user.role),
                          width: 40,
                          height: 40,
                          opacity: user.isBanned ? 0.5 : 1
                        }}>
                          {getRoleIcon(user.role)}
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
                        label={getRoleLabel(user.role)}
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
                        <HotelIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {getHotelName(user.hotelId)}
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
                <Avatar sx={{ bgcolor: getRoleColor(detailUser.role), width: 60, height: 60 }}>
                  {getRoleIcon(detailUser.role)}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">{detailUser.fullname || detailUser.username}</Typography>
                  <Typography variant="body1" color="text.secondary">{detailUser.email}</Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Tabs value={detailTabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tab label="Thông tin cơ bản" />
                <Tab label="Hoạt động" />
                <Tab label="Quyền & Vai trò" />
              </Tabs>

              {/* Tab Panels */}
              {detailTabValue === 0 && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Thông tin cá nhân
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">Role</Typography>
                      <Chip
                        label={getRoleLabel(detailUser.role)}
                        color={getRoleColor(detailUser.role) as any}
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
              )}

              {detailTabValue === 1 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                    <History sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Lịch sử đặt phòng
                  </Typography>

                  {detailUser.role === 'customer' ? (
                    userReservationsLoading ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CircularProgress size={40} />
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                          Đang tải lịch sử đặt phòng...
                        </Typography>
                      </Box>
                    ) : userReservations.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <History sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          Chưa có lịch sử đặt phòng
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Tổng cộng: {userReservations.length} đặt phòng
                        </Typography>
                        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                          <Table size="small">
                            <TableHead sx={{ background: '#f5f7fa' }}>
                              <TableRow>
                                <TableCell>Mã đặt phòng</TableCell>
                                <TableCell>Khách sạn</TableCell>
                                <TableCell>Ngày nhận</TableCell>
                                <TableCell>Ngày trả</TableCell>
                                <TableCell>Tổng tiền</TableCell>
                                <TableCell>Trạng thái</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {userReservations.slice(0, 10).map((reservation) => (
                                <TableRow key={reservation._id || reservation.id}>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight="medium">
                                      {reservation.bookingNumber || reservation._id || reservation.id}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {typeof reservation.hotel === 'object' && reservation.hotel?.name
                                        ? reservation.hotel.name
                                        : getHotelName(typeof reservation.hotel === 'string' ? reservation.hotel : reservation.hotel?._id || reservation.hotel?.id)
                                      }
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {(reservation as any).checkInDate ? new Date((reservation as any).checkInDate).toLocaleDateString('vi-VN') : 'N/A'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {(reservation as any).checkOutDate ? new Date((reservation as any).checkOutDate).toLocaleDateString('vi-VN') : 'N/A'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight="medium">
                                      {(reservation as any).payment?.totalPrice ? `${(reservation as any).payment.totalPrice.toLocaleString('vi-VN')} VND` : 'N/A'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      size="small"
                                      label={(() => {
                                        const status = (reservation as any).status;
                                        switch(status) {
                                          case 'pending': return 'Chờ duyệt';
                                          case 'approved': return 'Đã xác nhận';
                                          case 'checked_in': return 'Đã nhận phòng';
                                          case 'checked_out': return 'Đã trả phòng';
                                          case 'canceled': return 'Đã hủy';
                                          case 'completed': return 'Hoàn thành';
                                          default: return status || 'Unknown';
                                        }
                                      })()}
                                      color={(() => {
                                        const status = (reservation as any).status;
                                        switch(status) {
                                          case 'pending': return 'warning';
                                          case 'approved': return 'info';
                                          case 'checked_in':
                                          case 'checked_out':
                                          case 'completed': return 'success';
                                          case 'canceled': return 'error';
                                          default: return 'default';
                                        }
                                      })() as any}
                                      variant="outlined"
                                      sx={{ fontSize: '0.75rem' }}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        {userReservations.length > 10 && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                            Hiển thị 10 đặt phòng gần nhất, tổng cộng {userReservations.length} đặt phòng
                          </Typography>
                        )}
                      </Box>
                    )
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Person sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        Tính năng này chỉ dành cho khách hàng
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {detailTabValue === 2 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                    <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Quyền và vai trò
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary">
                        Vai trò hiện tại
                      </Typography>
                      <Box sx={{ mb: 3 }}>
                        <Chip
                          label={getRoleLabel(detailUser.role)}
                          icon={getRoleIcon(detailUser.role)}
                          color={getRoleColor(detailUser.role) as any}
                          size="medium"
                          sx={{ py: 1, px: 2, fontSize: '1rem' }}
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Quản trị viên có thể thay đổi vai trò từ "Khách hàng" lên "Quản lý khách sạn".<br />
                        Các vai trò khác không thể thay đổi được.
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary">
                        Thay đổi vai trò
                      </Typography>

                      {detailUser.role === 'customer' ? (
                        <>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Chọn vai trò mới cho người dùng này:
                          </Typography>
                          {!roleEditMode ? (
                            <Button
                              variant="contained"
                              startIcon={<Edit />}
                              onClick={() => setRoleEditMode(true)}
                              sx={{ mb: 2 }}
                            >
                              Thay đổi vai trò
                            </Button>
                          ) : (
                            <Box>
                              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                <InputLabel>Vai trò mới</InputLabel>
                                <Select
                                  value={newRole}
                                  label="Vai trò mới"
                                  onChange={(e) => setNewRole(e.target.value)}
                                >
                                  <MenuItem value="hotel-manager">Quản lý khách sạn</MenuItem>
                                </Select>
                              </FormControl>

                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  variant="contained"
                                  color="success"
                                  size="small"
                                  startIcon={<Save />}
                                  disabled={!newRole || newRole === detailUser.role || actionLoading}
                                  onClick={() => handleRoleChange((detailUser._id || detailUser.id).toString(), newRole)}
                                >
                                  {actionLoading ? 'Đang lưu...' : 'Lưu'}
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => {
                                    setRoleEditMode(false);
                                    setNewRole('');
                                  }}
                                >
                                  Hủy
                                </Button>
                              </Box>
                            </Box>
                          )}
                        </>
                      ) : (
                        <Alert severity="info" sx={{ mt: 0 }}>
                          Không thể thay đổi vai trò của {getRoleLabel(detailUser.role).toLowerCase()} thông qua giao diện này.
                        </Alert>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ mt: 4 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary">
                      Quyền của vai trò hiện tại
                    </Typography>
                    {detailUser.role === 'admin' && (
                      <Box component={Paper} sx={{ p: 2, bgcolor: 'error.main', color: 'black' }}>
                        <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
                        <Typography variant="body2" component="span" fontWeight="medium">
                          Toàn quyền quản trị hệ thống
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, color: 'rgba(0,0,0,0.8)' }}>
                          • Quản lý tất cả người dùng, khách sạn, đặt phòng<br />
                          • Xem và chỉnh sửa mọi dữ liệu<br />
                          • Thay đổi vai trò và quyền của người dùng<br />
                          • Xóa dữ liệu hệ thống
                        </Typography>
                      </Box>
                    )}
                    {detailUser.role === 'hotel-manager' && (
                      <Box component={Paper} sx={{ p: 2, bgcolor: 'warning.main', color: 'black' }}>
                        <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
                        <Typography variant="body2" component="span" fontWeight="medium">
                          Quản lý khách sạn
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, color: 'rgba(0,0,0,0.8)' }}>
                          • Quản lý khách sạn được chỉ định<br />
                          • Xem và chỉnh sửa đặt phòng của khách sạn<br />
                          • Quản lý nhân viên của khách sạn
                        </Typography>
                      </Box>
                    )}
                    {(detailUser.role === 'staff' || detailUser.role === 'shipper') && (
                      <Box component={Paper} sx={{ p: 2, bgcolor: 'info.main', color: 'black' }}>
                        <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
                        <Typography variant="body2" component="span" fontWeight="medium">
                          Nhân viên khách sạn
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, color: 'rgba(0,0,0,0.8)' }}>
                          • Xem và xử lý đặt phòng của khách sạn<br />
                          • Cập nhật trạng thái đặt phòng<br />
                          • Phục vụ khách hàng trực tiếp
                        </Typography>
                      </Box>
                    )}
                    {detailUser.role === 'customer' && (
                      <Box component={Paper} sx={{ p: 2, bgcolor: 'success.main', color: 'black' }}>
                        <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                        <Typography variant="body2" component="span" fontWeight="medium">
                          Khách hàng
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, color: 'rgba(0,0,0,0.8)' }}>
                          • Đặt phòng khách sạn<br />
                          • Xem lịch sử đặt phòng<br />
                          • Thanh toán và hủy đặt phòng<br />
                          • Xem và đánh giá khách sạn
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
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
