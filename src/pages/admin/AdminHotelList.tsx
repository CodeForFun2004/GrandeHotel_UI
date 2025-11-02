import React, { useState, useEffect, useMemo } from "react";
import {
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Collapse,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  Menu,
  DialogContentText
} from "@mui/material";
import {
  HotelClassRounded,
  Search,
  MeetingRoom,
  Business,
  Person,
  ExpandMore,
  ExpandLess,
  Edit,
  Delete,
  Add,
  PersonAdd,
  PersonRemove,
  MoreVert,
  Refresh,
  ErrorOutline
} from "@mui/icons-material";
import type { Hotel, User } from '../../types/entities';
import {
  getAllAdminHotels,
  createAdminHotel,
  updateAdminHotel,
  deleteAdminHotel,
  assignManagerToHotel,
  unassignManagerFromHotel,
  getAvailableManagers
} from '../../api/hotel';

// Hotel form data interface
interface HotelFormData {
  name: string;
  address: string;
  email: string;
  phone: string;
  description: string;
  images: File[];
  existingImages: string[];
}

const AdminHotelList: React.FC = () => {
  // API data state
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [availableManagers, setAvailableManagers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [search, setSearch] = useState("");
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    hotelDetails: true,
    rooms: true
  });

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [managerDialogOpen, setManagerDialogOpen] = useState(false);

  // Form states
  const [hotelForm, setHotelForm] = useState<HotelFormData>({
    name: '',
    address: '',
    email: '',
    phone: '',
    description: '',
    images: [],
    existingImages: []
  });
  const [managerForm, setManagerForm] = useState({
    selectedManagerId: ''
  });

  // Menu state for table actions
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedHotelForMenu, setSelectedHotelForMenu] = useState<Hotel | null>(null);

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Fetch data functions
  const fetchHotels = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllAdminHotels();
      setHotels(response.success ? response.data : []);
    } catch (error) {
      console.error('Error fetching hotels:', error);
      setError('Có lỗi xảy ra khi tải danh sách khách sạn');
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableManagers = async () => {
    try {
      const response = await getAvailableManagers();
      setAvailableManagers(response.success ? response.data : []);
    } catch (error) {
      console.error('Error fetching available managers:', error);
      setAvailableManagers([]);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchHotels();
    fetchAvailableManagers();
  }, []);

  // Computed values
  const selectedHotel = selectedHotelId ? hotels.find(h => h._id === selectedHotelId || h.id === selectedHotelId) : null;

  const filteredHotels = hotels.filter(hotel =>
    hotel.name.toLowerCase().includes(search.toLowerCase()) ||
    hotel.address?.toLowerCase().includes(search.toLowerCase()) ||
    hotel.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Current manager for selected hotel
  const currentManager = selectedHotel?.manager && typeof selectedHotel.manager === 'object' ? selectedHotel.manager : null;

  // Handler functions
  const handleHotelSelect = (hotelId: string) => {
    setSelectedHotelId(hotelId);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, hotel: Hotel) => {
    setAnchorEl(event.currentTarget);
    setSelectedHotelForMenu(hotel);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedHotelForMenu(null);
  };

  const handleCreateHotel = async () => {
    if (!hotelForm.name.trim() || !hotelForm.address.trim()) {
      setSnackbarMessage('Tên và địa chỉ khách sạn là bắt buộc');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      setActionLoading(true);
      await createAdminHotel({
        name: hotelForm.name.trim(),
        address: hotelForm.address.trim(),
        email: hotelForm.email.trim() || undefined,
        phone: hotelForm.phone.trim() || undefined,
        description: hotelForm.description.trim() || undefined
      }, hotelForm.images);

      setSnackbarMessage('Tạo khách sạn thành công');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setCreateDialogOpen(false);
      setHotelForm({ name: '', address: '', email: '', phone: '', description: '', images: [], existingImages: [] });
      fetchHotels();
    } catch (error: any) {
      console.error('Error creating hotel:', error);
      setSnackbarMessage(error.response?.data?.message || 'Có lỗi xảy ra khi tạo khách sạn');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditHotel = async () => {
    const currentName = hotelForm.name.trim();
    const currentAddress = hotelForm.address.trim();

    if (!selectedHotelForMenu || !currentName || !currentAddress) {
      setSnackbarMessage('Tên và địa chỉ khách sạn là bắt buộc');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      setActionLoading(true);
      await updateAdminHotel((selectedHotelForMenu._id || selectedHotelForMenu.id) as string, {
        name: currentName,
        address: currentAddress,
        email: hotelForm.email.trim() || undefined,
        phone: hotelForm.phone.trim() || undefined,
        description: hotelForm.description.trim() || undefined
      }, hotelForm.images);

      setSnackbarMessage('Cập nhật khách sạn thành công');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setEditDialogOpen(false);
      setSelectedHotelForMenu(null);
      setHotelForm({ name: '', address: '', email: '', phone: '', description: '', images: [], existingImages: [] });
      fetchHotels();
    } catch (error: any) {
      console.error('Error updating hotel:', error);
      setSnackbarMessage(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật khách sạn');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteHotel = async () => {
    if (!selectedHotelForMenu) return;

    try {
      setActionLoading(true);
      await deleteAdminHotel((selectedHotelForMenu._id || selectedHotelForMenu.id) as string);

      setSnackbarMessage('Xóa khách sạn thành công');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setDeleteDialogOpen(false);
      handleMenuClose();
      if (selectedHotelId === (selectedHotelForMenu._id || selectedHotelForMenu.id)) {
        setSelectedHotelId(null);
      }
      fetchHotels();
    } catch (error: any) {
      console.error('Error deleting hotel:', error);
      setSnackbarMessage(error.response?.data?.message || 'Có lỗi xảy ra khi xóa khách sạn');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignManager = async () => {
    if (!selectedHotelForMenu || !managerForm.selectedManagerId) {
      setSnackbarMessage('Vui lòng chọn quản lý');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      setActionLoading(true);
      await assignManagerToHotel(
        (selectedHotelForMenu._id || selectedHotelForMenu.id) as string,
        managerForm.selectedManagerId
      );

      setSnackbarMessage('Chỉ định quản lý thành công');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setManagerDialogOpen(false);
      setManagerForm({ selectedManagerId: '' });
      handleMenuClose();
      fetchHotels();
      fetchAvailableManagers();
    } catch (error: any) {
      console.error('Error assigning manager:', error);
      setSnackbarMessage(error.response?.data?.message || 'Có lỗi xảy ra khi chỉ định quản lý');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnassignManager = async () => {
    if (!selectedHotelForMenu) return;

    try {
      setActionLoading(true);
      await unassignManagerFromHotel((selectedHotelForMenu._id || selectedHotelForMenu.id) as string);

      setSnackbarMessage('Hủy chỉ định quản lý thành công');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleMenuClose();
      fetchHotels();
      fetchAvailableManagers();
    } catch (error: any) {
      console.error('Error unassigning manager:', error);
      setSnackbarMessage(error.response?.data?.message || 'Có lỗi xảy ra khi hủy chỉ định quản lý');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditDialog = (hotel: Hotel) => {
    console.log('Opening edit dialog for hotel:', hotel); // Debug log
    setAnchorEl(null);
    setSelectedHotelForMenu(hotel);
    setHotelForm({
      name: hotel.name || '',
      address: hotel.address || '',
      email: hotel.email || '',
      phone: hotel.phone || '',
      description: hotel.description || '',
      images: [],
      existingImages: hotel.images || []
    });
    console.log('Hotel form set to:', { // Debug log
      name: hotel.name || '',
      address: hotel.address || '',
      email: hotel.email || '',
      phone: hotel.phone || '',
      description: hotel.description || '',
      images: [],
      existingImages: hotel.images || []
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (hotel: Hotel) => {
    setAnchorEl(null);
    setSelectedHotelForMenu(hotel);
    setDeleteDialogOpen(true);
  };

  const openManagerDialog = (hotel: Hotel) => {
    setAnchorEl(null);
    setSelectedHotelForMenu(hotel);
    setManagerForm({ selectedManagerId: '' });
    setManagerDialogOpen(true);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <Box sx={{ p: 3, minHeight: 'calc(100vh - 64px)' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom fontWeight={700} color="primary.main">
          Quản lý khách sạn
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Thêm khách sạn
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              fetchHotels();
              fetchAvailableManagers();
            }}
            disabled={loading}
          >
            Làm mới
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3, boxShadow: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              variant="outlined"
              size="small"
              placeholder="Tìm kiếm tên, địa chỉ hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300 }}
            />
            <Typography variant="body2" color="text.secondary">
              Tổng cộng: {hotels.length} khách sạn
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Loading/Error State */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 8 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 2 }}>Đang tải danh sách khách sạn...</Typography>
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
            onClick={fetchHotels}
          >
            Thử lại
          </Button>
        </Box>
      ) : (
        <>
          {/* Hotels Table */}
          <Card sx={{ mb: 3, boxShadow: 3 }}>
            <CardContent>
              <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
                <Table>
                  <TableHead sx={{ background: "#f5f7fa" }}>
                    <TableRow>
                      <TableCell>Khách sạn</TableCell>
                      <TableCell>Địa chỉ</TableCell>
                      <TableCell>Liên hệ</TableCell>
                      <TableCell>Quản lý</TableCell>
                      <TableCell>Trạng thái</TableCell>
                      <TableCell align="center">Hành động</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredHotels.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                          <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                            <Search sx={{ fontSize: 48, color: 'text.disabled' }} />
                            <Typography variant="h6">Không tìm thấy khách sạn nào</Typography>
                            <Typography variant="body2">Thử thay đổi bộ lọc tìm kiếm</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHotels.map((hotel) => {
                        const manager = hotel.manager && typeof hotel.manager === 'object' ? hotel.manager : null;
                        return (
                          <TableRow
                            key={hotel._id || hotel.id}
                            hover
                            sx={{
                              transition: '0.2s',
                              '&:hover': { background: '#f0f4ff' },
                              backgroundColor: selectedHotelId === (hotel._id || hotel.id) ? '#e3f2fd' : 'transparent'
                            }}
                          >
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{
                                  bgcolor: selectedHotelId === (hotel._id || hotel.id) ? 'success.main' : 'primary.main',
                                  width: 40,
                                  height: 40
                                }}>
                                  <HotelClassRounded />
                                </Avatar>
                                <Box>
                                  <Typography fontWeight={selectedHotelId === (hotel._id || hotel.id) ? 600 : 500}>
                                    {hotel.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    ID: {hotel._id || hotel.id}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{hotel.address}</Typography>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2">{hotel.phone || 'N/A'}</Typography>
                                <Typography variant="caption" color="text.secondary">{hotel.email || 'N/A'}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              {manager ? (
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}>
                                    <Person />
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" fontWeight={600}>{manager.fullname}</Typography>
                                    <Typography variant="caption" color="text.secondary">{manager.email}</Typography>
                                  </Box>
                                </Box>
                              ) : (
                                <Chip
                                  label="Chưa chỉ định"
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={hotel.status || 'available'}
                                color={(hotel.status === 'full' || hotel.status === 'closed') ? 'error' : 'success'}
                                variant="outlined"
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Box display="flex" gap={1} justifyContent="center">
                                <Button
                                  size="small"
                                  variant={selectedHotelId === (hotel._id || hotel.id) ? "contained" : "outlined"}
                                  onClick={() => handleHotelSelect((hotel._id || hotel.id) as string)}
                                >
                                  {selectedHotelId === (hotel._id || hotel.id) ? "Đang chọn" : "Chọn"}
                                </Button>
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleMenuOpen(e, hotel)}
                                >
                                  <MoreVert />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Selected Hotel Details */}
          {selectedHotel && (
            <>
              {/* Hotel Information */}
              <Card sx={{ mb: 3, boxShadow: 3 }}>
                <CardContent>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => toggleSection('hotelDetails')}
                  >
                    <Typography variant="h6" fontWeight="bold">
                      Thông tin khách sạn: {selectedHotel.name}
                    </Typography>
                    <IconButton size="small">
                      {expandedSections.hotelDetails ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>
                  <Collapse in={expandedSections.hotelDetails}>
                    <Box sx={{ mt: 2 }}>
                      <Box display="flex" alignItems="center" gap={2} mb={3}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 60, height: 60 }}>
                          <HotelClassRounded fontSize="large" />
                        </Avatar>
                        <Box>
                          <Typography variant="h5" fontWeight="bold">
                            {selectedHotel.name}
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            {selectedHotel.address}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                        {/* Hotel Contact Information */}
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary.main">
                            Thông tin liên hệ
                          </Typography>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">Điện thoại</Typography>
                            <Typography variant="body1">{selectedHotel.phone || 'N/A'}</Typography>
                          </Box>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">Email</Typography>
                            <Typography variant="body1">{selectedHotel.email || 'N/A'}</Typography>
                          </Box>
                        </Box>

                        {/* Manager Information */}
                        <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                          <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary.main">
                            Quản lý
                          </Typography>
                          {currentManager ? (
                            <Box alignItems="center" gap={2}>
                              <Avatar sx={{ bgcolor: 'warning.main', width: 48, height: 48 }}>
                                <Business />
                              </Avatar>
                              <Box>
                                <Typography variant="h6" fontWeight={600}>{currentManager.fullname}</Typography>
                                <Typography variant="body2">{currentManager.email}</Typography>
                              </Box>
                            </Box>
                          ) : (
                            <Box alignItems="center" gap={2}>
                              <Avatar sx={{ bgcolor: 'warning.main', width: 48, height: 48 }}>
                                <PersonRemove />
                              </Avatar>
                              <Box>
                                <Typography variant="h6" fontWeight={600} color="text.secondary">
                                  Chưa có quản lý
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Chưa chỉ định
                                </Typography>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </Box>

                      {/* Hotel Description */}
                      {selectedHotel.description && (
                        <>
                          <Divider sx={{ my: 3 }} />
                          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            Mô tả
                          </Typography>
                          <Typography variant="body1">
                            {selectedHotel.description}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>

              {/* Rooms Section */}
              <Card sx={{ boxShadow: 3 }}>
                <CardContent>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => toggleSection('rooms')}
                  >
                    <Typography variant="h6" fontWeight="bold">
                      Danh sách phòng: {selectedHotel.name}
                    </Typography>
                    <IconButton size="small">
                      {expandedSections.rooms ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>
                  <Collapse in={expandedSections.rooms}>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body1" color="text.secondary" gutterBottom>
                        Các phòng của khách sạn {selectedHotel.name}
                      </Typography>
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Tính năng quản lý phòng đang được phát triển. Hiện tại, bạn có thể quản lý phòng
                        thông qua menu "Quản lý phòng" riêng biệt của hệ thống.
                      </Alert>
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            </>
          )}

          {/* Actions Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            {selectedHotelForMenu && [
              <MenuItem key="edit" onClick={() => openEditDialog(selectedHotelForMenu)}>
                <Edit sx={{ mr: 1 }} />
                Chỉnh sửa
              </MenuItem>,
              <MenuItem key="assign-manager" onClick={() => openManagerDialog(selectedHotelForMenu)}>
                <PersonAdd sx={{ mr: 1 }} />
                Chỉ định quản lý
              </MenuItem>,
              selectedHotelForMenu.manager && (
                <MenuItem key="unassign-manager" onClick={handleUnassignManager}>
                  <PersonRemove sx={{ mr: 1 }} />
                  Hủy chỉ định quản lý
                </MenuItem>
              ),
              <Divider key="divider" />,
              <MenuItem key="delete" onClick={() => openDeleteDialog(selectedHotelForMenu)} sx={{ color: 'error.main' }}>
                <Delete sx={{ mr: 1 }} />
                Xóa khách sạn
              </MenuItem>
            ]}
          </Menu>

          {/* Create Hotel Dialog */}
          <Dialog
            open={createDialogOpen}
            onClose={() => setCreateDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Thêm khách sạn mới</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Tên khách sạn *"
                  value={hotelForm.name}
                  onChange={(e) => {
                    const value = e.target.value;
                    setHotelForm(prev => ({ ...prev, name: value }));
                  }}
                  fullWidth
                  required
                />
                <TextField
                  label="Địa chỉ *"
                  value={hotelForm.address}
                  onChange={(e) => {
                    const value = e.target.value;
                    setHotelForm(prev => ({ ...prev, address: value }));
                  }}
                  fullWidth
                  multiline
                  rows={2}
                  required
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Email"
                    type="email"
                    value={hotelForm.email}
                    onChange={(e) => {
                      const value = e.target.value;
                      setHotelForm(prev => ({ ...prev, email: value }));
                    }}
                  />
                  <TextField
                    label="Điện thoại"
                    value={hotelForm.phone}
                    onChange={(e) => {
                      const value = e.target.value;
                      setHotelForm(prev => ({ ...prev, phone: value }));
                    }}
                  />
                </Box>
                <TextField
                  label="Mô tả"
                  value={hotelForm.description}
                  onChange={(e) => {
                    const value = e.target.value;
                    setHotelForm(prev => ({ ...prev, description: value }));
                  }}
                  fullWidth
                  multiline
                  rows={3}
                />

                {/* Image Upload Section */}
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Hình ảnh khách sạn</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                    {/* Existing Images Preview */}
                    {hotelForm.existingImages.map((imageUrl, index) => (
                      <Box key={`existing-${index}`} sx={{ position: 'relative' }}>
                        <img
                          src={imageUrl}
                          alt={`Existing ${index + 1}`}
                          style={{
                            width: 100,
                            height: 100,
                            objectFit: 'cover',
                            borderRadius: 8,
                            border: '2px solid #e0e0e0'
                          }}
                        />
                        <IconButton
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            bgcolor: 'error.main',
                            color: 'white',
                            '&:hover': { bgcolor: 'error.dark' }
                          }}
                          onClick={() => {
                            setHotelForm(prev => ({
                              ...prev,
                              existingImages: prev.existingImages.filter((_, i) => i !== index)
                            }));
                          }}
                        >
                          <Delete sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    ))}

                    {/* New Images Preview */}
                    {hotelForm.images.map((file, index) => (
                      <Box key={`new-${index}`} sx={{ position: 'relative' }}>
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New ${index + 1}`}
                          style={{
                            width: 100,
                            height: 100,
                            objectFit: 'cover',
                            borderRadius: 8,
                            border: '2px solid #e0e0e0'
                          }}
                        />
                        <IconButton
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            bgcolor: 'error.main',
                            color: 'white',
                            '&:hover': { bgcolor: 'error.dark' }
                          }}
                          onClick={() => {
                            setHotelForm(prev => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== index)
                            }));
                          }}
                        >
                          <Delete sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    ))}

                    {/* Upload Button */}
                    <Box
                      component="label"
                      sx={{
                        width: 100,
                        height: 100,
                        border: '2px dashed #ccc',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        '&:hover': { borderColor: 'primary.main' }
                      }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setHotelForm(prev => ({
                            ...prev,
                            images: [...prev.images, ...files]
                          }));
                        }}
                      />
                      <Add sx={{ color: 'action.disabled' }} />
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Chọn nhiều hình ảnh (tối đa 10 ảnh, mỗi ảnh dưới 5MB)
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCreateDialogOpen(false)}>Hủy</Button>
              <Button
                onClick={handleCreateHotel}
                variant="contained"
                disabled={actionLoading}
              >
                {actionLoading ? <CircularProgress size={20} /> : 'Tạo'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Edit Hotel Dialog */}
          <Dialog
            open={editDialogOpen}
            onClose={() => {
              setEditDialogOpen(false);
              setSelectedHotelForMenu(null);
            }}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Chỉnh sửa khách sạn</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Tên khách sạn *"
                  value={hotelForm.name}
                  onChange={(e) => {
                    const value = e.target.value;
                    setHotelForm(prev => ({ ...prev, name: value }));
                  }}
                  fullWidth
                  required
                />
                <TextField
                  label="Địa chỉ *"
                  value={hotelForm.address}
                  onChange={(e) => {
                    const value = e.target.value;
                    setHotelForm(prev => ({ ...prev, address: value }));
                  }}
                  fullWidth
                  multiline
                  rows={2}
                  required
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Email"
                    type="email"
                    value={hotelForm.email}
                    onChange={(e) => {
                      const value = e.target.value;
                      setHotelForm(prev => ({ ...prev, email: value }));
                    }}
                  />
                  <TextField
                    label="Điện thoại"
                    value={hotelForm.phone}
                    onChange={(e) => {
                      const value = e.target.value;
                      setHotelForm(prev => ({ ...prev, phone: value }));
                    }}
                  />
                </Box>
                <TextField
                  label="Mô tả"
                  value={hotelForm.description}
                  onChange={(e) => {
                    const value = e.target.value;
                    setHotelForm(prev => ({ ...prev, description: value }));
                  }}
                  fullWidth
                  multiline
                  rows={3}
                />

                {/* Image Upload Section */}
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Hình ảnh khách sạn</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                    {/* Existing Images Preview */}
                    {hotelForm.existingImages.map((imageUrl, index) => (
                      <Box key={`existing-${index}`} sx={{ position: 'relative' }}>
                        <img
                          src={imageUrl}
                          alt={`Existing ${index + 1}`}
                          style={{
                            width: 100,
                            height: 100,
                            objectFit: 'cover',
                            borderRadius: 8,
                            border: '2px solid #e0e0e0'
                          }}
                        />
                        <IconButton
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            bgcolor: 'error.main',
                            color: 'white',
                            '&:hover': { bgcolor: 'error.dark' }
                          }}
                          onClick={() => {
                            setHotelForm(prev => ({
                              ...prev,
                              existingImages: prev.existingImages.filter((_, i) => i !== index)
                            }));
                          }}
                        >
                          <Delete sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    ))}

                    {/* New Images Preview */}
                    {hotelForm.images.map((file, index) => (
                      <Box key={`new-${index}`} sx={{ position: 'relative' }}>
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`New ${index + 1}`}
                          style={{
                            width: 100,
                            height: 100,
                            objectFit: 'cover',
                            borderRadius: 8,
                            border: '2px solid #e0e0e0'
                          }}
                        />
                        <IconButton
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            bgcolor: 'error.main',
                            color: 'white',
                            '&:hover': { bgcolor: 'error.dark' }
                          }}
                          onClick={() => {
                            setHotelForm(prev => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== index)
                            }));
                          }}
                        >
                          <Delete sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    ))}

                    {/* Upload Button */}
                    <Box
                      component="label"
                      sx={{
                        width: 100,
                        height: 100,
                        border: '2px dashed #ccc',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        '&:hover': { borderColor: 'primary.main' }
                      }}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setHotelForm(prev => ({
                            ...prev,
                            images: [...prev.images, ...files]
                          }));
                        }}
                      />
                      <Add sx={{ color: 'action.disabled' }} />
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Chọn nhiều hình ảnh (tối đa 10 ảnh, mỗi ảnh dưới 5MB)
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialogOpen(false)}>Hủy</Button>
              <Button
                onClick={handleEditHotel}
                variant="contained"
                disabled={actionLoading}
              >
                {actionLoading ? <CircularProgress size={20} /> : 'Cập nhật'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Bạn có chắc muốn xóa khách sạn "{selectedHotelForMenu?.name}" không?
                Hành động này không thể hoàn tác.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
              <Button
                onClick={handleDeleteHotel}
                color="error"
                variant="contained"
                disabled={actionLoading}
              >
                {actionLoading ? <CircularProgress size={20} /> : 'Xóa'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Manager Assignment Dialog */}
          <Dialog
            open={managerDialogOpen}
            onClose={() => setManagerDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              {selectedHotelForMenu?.manager ? 'Thay đổi quản lý' : 'Chỉ định quản lý'}
            </DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ mb: 2 }}>
                Chọn quản lý cho khách sạn "{selectedHotelForMenu?.name}":
              </DialogContentText>
              <FormControl fullWidth>
                <InputLabel>Quản lý</InputLabel>
                <Select
                  value={managerForm.selectedManagerId}
                  label="Quản lý"
                  onChange={(e) => {
                    const value = e.target.value;
                    setManagerForm(prev => ({ ...prev, selectedManagerId: value }));
                  }}
                >
                  <MenuItem value="">
                    <em>Chọn quản lý...</em>
                  </MenuItem>
                  {availableManagers.map((manager) => (
                    <MenuItem key={manager._id || manager.id} value={manager._id || manager.id}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}>
                          <Person />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {manager.fullname}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {manager.email}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {availableManagers.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Không có quản lý nào khả dụng. Vui lòng tạo quản lý mới trước.
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setManagerDialogOpen(false)}>Hủy</Button>
              <Button
                onClick={handleAssignManager}
                variant="contained"
                disabled={actionLoading || !managerForm.selectedManagerId}
              >
                {actionLoading ? <CircularProgress size={20} /> : 'Chỉ định'}
              </Button>
            </DialogActions>
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
        </>
      )}
    </Box>
  );
};

export default AdminHotelList;
