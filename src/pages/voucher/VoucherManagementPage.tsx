import React, { useState, useEffect, useMemo } from "react";
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
  Chip,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  Menu,
  Switch,
  FormControlLabel,
  Autocomplete,
  Grid,
  Divider
} from "@mui/material";
import {
  Search,
  Add,
  Edit,
  Delete,
  MoreVert,
  Refresh,
  LocalOffer,
  CalendarToday,
  AttachMoney,
  Hotel as HotelIcon,
  CheckCircle,
  Cancel
} from "@mui/icons-material";
import type { Voucher, Hotel } from '../../types/entities';
import {
  getAllVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher
} from '../../api/voucher';
import { getAllAdminHotels } from '../../api/hotel';
import { VoucherSearch } from './components/VoucherSearch';
import { VoucherFilters, type VoucherStatusFilter, type VoucherScopeFilter } from './components/VoucherFilters';

interface VoucherFormData {
  code: string;
  name: string;
  description: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  maxDiscount: number | null;
  minBookingValue: number;
  scope: 'global' | 'multi-hotel';
  hotelIds: string[];
  startDate: string;
  endDate: string;
  maxUsageGlobal: number;
  maxUsagePerUser: number;
  status: 'active' | 'inactive';
}

const VoucherManagementPage: React.FC = () => {
  // API data state
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<VoucherStatusFilter>("all");
  const [scopeFilter, setScopeFilter] = useState<VoucherScopeFilter>("all");

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  // Menu state for table actions
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVoucherForMenu, setSelectedVoucherForMenu] = useState<Voucher | null>(null);

  // Form state
  const [voucherForm, setVoucherForm] = useState<VoucherFormData>({
    code: '',
    name: '',
    description: '',
    discountType: 'percent',
    discountValue: 0,
    maxDiscount: null,
    minBookingValue: 0,
    scope: 'global',
    hotelIds: [],
    startDate: '',
    endDate: '',
    maxUsageGlobal: 0,
    maxUsagePerUser: 0,
    status: 'active'
  });

  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Fetch data functions
  const fetchVouchers = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: { status?: 'active' | 'inactive'; scope?: 'global' | 'multi-hotel' } = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter as 'active' | 'inactive';
      }
      if (scopeFilter !== 'all') {
        params.scope = scopeFilter as 'global' | 'multi-hotel';
      }
      const response = await getAllVouchers(params);
      // Handle different response formats
      if (Array.isArray(response)) {
        setVouchers(response);
      } else if (response.results && Array.isArray(response.results)) {
        setVouchers(response.results);
      } else if (response.data && Array.isArray(response.data)) {
        setVouchers(response.data);
      } else {
        console.warn('Unexpected response format:', response);
        setVouchers([]);
      }
    } catch (error: any) {
      console.error('Error fetching vouchers:', error);
      setError(error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi tải danh sách voucher');
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHotels = async () => {
    try {
      const response = await getAllAdminHotels();
      setHotels(response.success ? response.data : []);
    } catch (error) {
      console.error('Error fetching hotels:', error);
      setHotels([]);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchVouchers();
    fetchHotels();
  }, [statusFilter, scopeFilter]);

  // Filtered vouchers
  const filteredVouchers = useMemo(() => {
    if (!search) return vouchers;
    const searchLower = search.toLowerCase();
    return vouchers.filter(v =>
      v.code?.toLowerCase().includes(searchLower) ||
      v.name?.toLowerCase().includes(searchLower) ||
      v.description?.toLowerCase().includes(searchLower)
    );
  }, [vouchers, search]);

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, voucher: Voucher) => {
    setAnchorEl(event.currentTarget);
    setSelectedVoucherForMenu(voucher);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedVoucherForMenu(null);
  };

  // Dialog handlers
  const handleCreateClick = () => {
    setVoucherForm({
      code: '',
      name: '',
      description: '',
      discountType: 'percent',
      discountValue: 0,
      maxDiscount: null,
      minBookingValue: 0,
      scope: 'global',
      hotelIds: [],
      startDate: '',
      endDate: '',
      maxUsageGlobal: 0,
      maxUsagePerUser: 0,
      status: 'active'
    });
    setCreateDialogOpen(true);
  };

  const handleEditClick = (voucher: Voucher) => {
    const hotelIds = Array.isArray(voucher.hotelIds)
      ? voucher.hotelIds.map(h => typeof h === 'string' ? h : (h._id || h.id || ''))
      : [];
    
    setVoucherForm({
      code: voucher.code || '',
      name: voucher.name || '',
      description: voucher.description || '',
      discountType: voucher.discountType || 'percent',
      discountValue: voucher.discountValue || 0,
      maxDiscount: voucher.maxDiscount ?? null,
      minBookingValue: voucher.minBookingValue || 0,
      scope: voucher.scope || 'global',
      hotelIds: hotelIds,
      startDate: voucher.startDate ? (typeof voucher.startDate === 'string' ? voucher.startDate.split('T')[0] : new Date(voucher.startDate).toISOString().split('T')[0]) : '',
      endDate: voucher.endDate ? (typeof voucher.endDate === 'string' ? voucher.endDate.split('T')[0] : new Date(voucher.endDate).toISOString().split('T')[0]) : '',
      maxUsageGlobal: voucher.maxUsageGlobal || 0,
      maxUsagePerUser: voucher.maxUsagePerUser || 0,
      status: voucher.status || 'active'
    });
    setSelectedVoucher(voucher);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteClick = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  // Form handlers
  const handleFormChange = (field: keyof VoucherFormData, value: any) => {
    setVoucherForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setActionLoading(true);
      
      // Validation
      if (!voucherForm.code || !voucherForm.name) {
        setSnackbarMessage('Vui lòng điền đầy đủ thông tin bắt buộc');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      if (voucherForm.discountValue <= 0) {
        setSnackbarMessage('Giá trị giảm giá phải lớn hơn 0');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      if (voucherForm.discountType === 'percent' && voucherForm.discountValue > 100) {
        setSnackbarMessage('Phần trăm giảm giá không được vượt quá 100%');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      if (!voucherForm.startDate || !voucherForm.endDate) {
        setSnackbarMessage('Vui lòng chọn ngày bắt đầu và kết thúc');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      if (new Date(voucherForm.endDate) <= new Date(voucherForm.startDate)) {
        setSnackbarMessage('Ngày kết thúc phải sau ngày bắt đầu');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      if (voucherForm.scope === 'multi-hotel' && voucherForm.hotelIds.length === 0) {
        setSnackbarMessage('Vui lòng chọn ít nhất một khách sạn cho voucher multi-hotel');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      const payload: Partial<Voucher> = {
        code: voucherForm.code.toUpperCase().trim(),
        name: voucherForm.name,
        description: voucherForm.description,
        discountType: voucherForm.discountType,
        discountValue: voucherForm.discountValue,
        maxDiscount: voucherForm.maxDiscount,
        minBookingValue: voucherForm.minBookingValue,
        scope: voucherForm.scope,
        hotelIds: voucherForm.scope === 'multi-hotel' ? voucherForm.hotelIds : undefined,
        startDate: voucherForm.startDate,
        endDate: voucherForm.endDate,
        maxUsageGlobal: voucherForm.maxUsageGlobal || 0,
        maxUsagePerUser: voucherForm.maxUsagePerUser || 0,
        status: voucherForm.status
      };

      if (selectedVoucher) {
        // Update
        const voucherId = selectedVoucher._id || selectedVoucher.id;
        if (voucherId) {
          await updateVoucher(voucherId, payload);
          setSnackbarMessage('Cập nhật voucher thành công');
        }
      } else {
        // Create
        await createVoucher(payload);
        setSnackbarMessage('Tạo voucher thành công');
      }

      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setCreateDialogOpen(false);
      setEditDialogOpen(false);
      setSelectedVoucher(null);
      fetchVouchers();
    } catch (error: any) {
      setSnackbarMessage(error?.response?.data?.message || 'Có lỗi xảy ra');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedVoucher) return;
    try {
      setActionLoading(true);
      const voucherId = selectedVoucher._id || selectedVoucher.id;
      if (voucherId) {
        await deleteVoucher(voucherId);
        setSnackbarMessage('Xóa voucher thành công');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setDeleteDialogOpen(false);
        setSelectedVoucher(null);
        fetchVouchers();
      }
    } catch (error: any) {
      setSnackbarMessage(error?.response?.data?.message || 'Có lỗi xảy ra');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setActionLoading(false);
    }
  };

  // Format helpers
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('vi-VN');
  };

  const formatDiscount = (voucher: Voucher) => {
    if (voucher.discountType === 'percent') {
      return `${voucher.discountValue}%${voucher.maxDiscount ? ` (tối đa ${voucher.maxDiscount.toLocaleString()} VNĐ)` : ''}`;
    }
    return `${voucher.discountValue.toLocaleString()} VNĐ`;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      default: return 'default';
    }
  };

  const isVoucherExpired = (voucher: Voucher) => {
    if (!voucher.endDate) return false;
    const endDate = typeof voucher.endDate === 'string' ? new Date(voucher.endDate) : voucher.endDate;
    return endDate < new Date();
  };

  const isVoucherActive = (voucher: Voucher) => {
    if (voucher.status !== 'active') return false;
    if (isVoucherExpired(voucher)) return false;
    if (!voucher.startDate) return false;
    const startDate = typeof voucher.startDate === 'string' ? new Date(voucher.startDate) : voucher.startDate;
    return startDate <= new Date();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Quản lý Voucher
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateClick}
          sx={{ textTransform: 'none' }}
        >
          Tạo Voucher Mới
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <VoucherSearch value={search} onChange={setSearch} />
            </Grid>
            <Grid item xs={12} md={8}>
              <VoucherFilters
                statusFilter={statusFilter}
                scopeFilter={scopeFilter}
                onStatusChange={setStatusFilter}
                onScopeChange={setScopeFilter}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Vouchers Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mã Voucher</TableCell>
                <TableCell>Tên</TableCell>
                <TableCell>Giảm giá</TableCell>
                <TableCell>Phạm vi</TableCell>
                <TableCell>Ngày bắt đầu</TableCell>
                <TableCell>Ngày kết thúc</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredVouchers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="textSecondary">Không có voucher nào</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVouchers.map((voucher) => {
                  const active = isVoucherActive(voucher);
                  const expired = isVoucherExpired(voucher);
                  return (
                    <TableRow key={voucher._id || voucher.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocalOffer fontSize="small" color="primary" />
                          <Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                            {voucher.code}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {voucher.name}
                        </Typography>
                        {voucher.description && (
                          <Typography variant="caption" color="textSecondary">
                            {voucher.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDiscount(voucher)}
                        </Typography>
                        {voucher.minBookingValue > 0 && (
                          <Typography variant="caption" color="textSecondary">
                            Đơn tối thiểu: {voucher.minBookingValue.toLocaleString()} VNĐ
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={voucher.scope === 'global' ? 'Toàn hệ thống' : 'Nhiều khách sạn'}
                          size="small"
                          icon={voucher.scope === 'multi-hotel' ? <HotelIcon /> : undefined}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarToday fontSize="small" color="action" />
                          <Typography variant="body2">{formatDate(voucher.startDate)}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarToday fontSize="small" color="action" />
                          <Typography variant="body2">{formatDate(voucher.endDate)}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Chip
                            label={voucher.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                            size="small"
                            color={getStatusColor(voucher.status) as any}
                            icon={voucher.status === 'active' ? <CheckCircle /> : <Cancel />}
                          />
                          {expired && (
                            <Chip label="Hết hạn" size="small" color="error" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, voucher)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedVoucherForMenu && handleEditClick(selectedVoucherForMenu)}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Chỉnh sửa
        </MenuItem>
        <MenuItem onClick={() => selectedVoucherForMenu && handleDeleteClick(selectedVoucherForMenu)}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Xóa
        </MenuItem>
      </Menu>

      {/* Create/Edit Dialog */}
      <Dialog
        open={createDialogOpen || editDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
          setSelectedVoucher(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedVoucher ? 'Chỉnh sửa Voucher' : 'Tạo Voucher Mới'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mã Voucher *"
                  value={voucherForm.code}
                  onChange={(e) => handleFormChange('code', e.target.value)}
                  required
                  disabled={!!selectedVoucher}
                  helperText={selectedVoucher ? 'Không thể thay đổi mã voucher' : 'Mã sẽ được chuyển thành chữ hoa'}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tên Voucher *"
                  value={voucherForm.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Mô tả"
                  value={voucherForm.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Loại giảm giá *</InputLabel>
                  <Select
                    value={voucherForm.discountType}
                    label="Loại giảm giá *"
                    onChange={(e) => handleFormChange('discountType', e.target.value)}
                  >
                    <MenuItem value="percent">Phần trăm (%)</MenuItem>
                    <MenuItem value="fixed">Số tiền cố định</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={voucherForm.discountType === 'percent' ? 'Phần trăm giảm (%) *' : 'Số tiền giảm (VNĐ) *'}
                  type="number"
                  value={voucherForm.discountValue}
                  onChange={(e) => handleFormChange('discountValue', Number(e.target.value))}
                  required
                  inputProps={{ min: 0, step: voucherForm.discountType === 'percent' ? 1 : 1000 }}
                />
              </Grid>
              {voucherForm.discountType === 'percent' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Giảm tối đa (VNĐ)"
                    type="number"
                    value={voucherForm.maxDiscount || ''}
                    onChange={(e) => handleFormChange('maxDiscount', e.target.value ? Number(e.target.value) : null)}
                    helperText="Để trống nếu không giới hạn"
                    inputProps={{ min: 0, step: 1000 }}
                  />
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Đơn hàng tối thiểu (VNĐ)"
                  type="number"
                  value={voucherForm.minBookingValue}
                  onChange={(e) => handleFormChange('minBookingValue', Number(e.target.value))}
                  inputProps={{ min: 0, step: 1000 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Phạm vi *</InputLabel>
                  <Select
                    value={voucherForm.scope}
                    label="Phạm vi *"
                    onChange={(e) => {
                      handleFormChange('scope', e.target.value);
                      if (e.target.value === 'global') {
                        handleFormChange('hotelIds', []);
                      }
                    }}
                  >
                    <MenuItem value="global">Toàn hệ thống</MenuItem>
                    <MenuItem value="multi-hotel">Nhiều khách sạn</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {voucherForm.scope === 'multi-hotel' && (
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    multiple
                    options={hotels}
                    getOptionLabel={(option) => option.name || ''}
                    value={hotels.filter(h => voucherForm.hotelIds.includes(h._id || h.id || ''))}
                    onChange={(_, newValue) => {
                      handleFormChange('hotelIds', newValue.map(h => h._id || h.id || '').filter(Boolean));
                    }}
                    renderInput={(params) => (
                      <TextField {...params} label="Chọn khách sạn *" />
                    )}
                  />
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ngày bắt đầu *"
                  type="date"
                  value={voucherForm.startDate}
                  onChange={(e) => handleFormChange('startDate', e.target.value)}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ngày kết thúc *"
                  type="date"
                  value={voucherForm.endDate}
                  onChange={(e) => handleFormChange('endDate', e.target.value)}
                  required
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: voucherForm.startDate || undefined }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Số lần sử dụng tối đa (toàn hệ thống)"
                  type="number"
                  value={voucherForm.maxUsageGlobal}
                  onChange={(e) => handleFormChange('maxUsageGlobal', Number(e.target.value))}
                  helperText="0 = không giới hạn"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Số lần sử dụng tối đa (mỗi người dùng)"
                  type="number"
                  value={voucherForm.maxUsagePerUser}
                  onChange={(e) => handleFormChange('maxUsagePerUser', Number(e.target.value))}
                  helperText="0 = không giới hạn"
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={voucherForm.status === 'active'}
                      onChange={(e) => handleFormChange('status', e.target.checked ? 'active' : 'inactive')}
                    />
                  }
                  label="Trạng thái hoạt động"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCreateDialogOpen(false);
              setEditDialogOpen(false);
              setSelectedVoucher(null);
            }}
            disabled={actionLoading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : selectedVoucher ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc chắn muốn xóa voucher <strong>{selectedVoucher?.code}</strong>? Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={actionLoading}>
            Hủy
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={20} /> : 'Xóa'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VoucherManagementPage;
