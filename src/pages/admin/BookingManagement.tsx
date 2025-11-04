import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  Paper,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  IconButton,
  Tooltip,
  Pagination,
} from "@mui/material";
import {
  Search,
  FilterList,
  CheckCircle,
  Cancel,
  Visibility,
} from "@mui/icons-material";
import {
  getAllReservations as apiGetAllReservations,
  approveReservation as apiApproveReservation,
} from "../../api/reservation";

// Types
type ReservationStatus = "pending" | "approved" | "rejected" | "canceled" | "completed";

interface Booking {
  id: string;
  reservationCode: string; // short reservation id (last 6)
  customerName: string; // fullname or username
  customerEmail: string;
  checkIn: string; // expected
  checkOut: string; // expected
  reservationStatus: ReservationStatus;
  createdAt: string;
  paymentMethod?: string;
}

const STATUS_CONFIG: Record<ReservationStatus, { label: string; color: any; icon: any }> = {
  pending: { label: "Chờ duyệt", color: "warning", icon: <FilterList /> },
  approved: { label: "Đã duyệt", color: "info", icon: <CheckCircle /> },
  rejected: { label: "Từ chối", color: "error", icon: <Cancel /> },
  canceled: { label: "Đã hủy", color: "error", icon: <Cancel /> },
  completed: { label: "Hoàn tất", color: "success", icon: <CheckCircle /> },
};

const STATUS_FLOW: Record<ReservationStatus, string[]> = {
  pending: ["approved", "rejected"],
  approved: [],
  rejected: [],
  canceled: [],
  completed: [],
};

export default function BookingManagement() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionDialog, setActionDialog] = useState(false);
  const [actionType, setActionType] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch reservations on mount
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        const data = await apiGetAllReservations();
        const reservations = Array.isArray(data?.reservations) ? data.reservations : [];
        const mapped: Booking[] = reservations.map((r: any) => ({
          id: r?._id,
          reservationCode: (r?._id || '').slice(-6).toUpperCase(),
          customerName: r?.customer?.fullname || r?.customer?.username || 'Khách lẻ',
          customerEmail: r?.customer?.email || '-',
          checkIn: r?.checkInDate ? new Date(r.checkInDate).toISOString().slice(0, 10) : '-',
          checkOut: r?.checkOutDate ? new Date(r.checkOutDate).toISOString().slice(0, 10) : '-',
          reservationStatus: (r?.status as ReservationStatus) || 'pending',
          createdAt: r?.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : '-',
          paymentMethod: r?.payment?.paymentMethod,
        }));
        setBookings(mapped);
      } catch (err) {
        console.error('Failed to fetch reservations', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReservations();
  }, []);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesSearch = 
        booking.reservationCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || booking.reservationStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchTerm, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredBookings.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (_event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (event: any) => {
    setRowsPerPage(Number(event.target.value));
    setPage(1); // Reset to first page
  };

  // Get available actions for a booking
  const getAvailableActions = (booking: Booking) => {
    return STATUS_FLOW[booking.reservationStatus] || [];
  };

  // Handle status change
  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      if (newStatus === 'approved') {
        await apiApproveReservation(bookingId, 'approve');
      } else if (newStatus === 'rejected') {
        await apiApproveReservation(bookingId, 'cancel', 'Rejected by manager');
      } else {
        // For other actions (paid, checked-in, checked-out) we will handle in detail flows
      }

      // Optimistic UI update
      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, reservationStatus: newStatus as ReservationStatus }
            : booking
        )
      );
    } catch (err) {
      console.error('Failed to update booking status', err);
    } finally {
      setActionDialog(false);
      setSelectedBooking(null);
    }
  };

  // Open action dialog
  const openActionDialog = (booking: Booking, action: string) => {
    setSelectedBooking(booking);
    setActionType(action);
    setActionDialog(true);
  };

  // View booking detail
  const viewBookingDetail = (booking: Booking) => {
    navigate(`/manager/bookings/${booking.id}`);
  };

  // Get status color
  const getStatusColor = (status: ReservationStatus) => {
    return STATUS_CONFIG[status]?.color || "secondary";
  };

  // Get status label
  const getStatusLabel = (status: ReservationStatus) => {
    return STATUS_CONFIG[status]?.label || status;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700} color="primary.main">
        Quản lý đặt phòng
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
            <TextField
              fullWidth
              size="small"
              label="Tìm kiếm (mã booking, tên khách hàng, email)"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1); // Reset to first page when searching
              }}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1); // Reset to first page when filtering
                }}
                label="Trạng thái"
              >
                <MenuItem value="all">Tất cả</MenuItem>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <MenuItem key={key} value={key}>
                    {config.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <TableContainer component={Paper}>
        <Table sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell>Mã đặt chỗ</TableCell>
              <TableCell>Khách hàng</TableCell>
              <TableCell>Ngày nhận (dự kiến)</TableCell>
              <TableCell>Ngày trả (dự kiến)</TableCell>
              <TableCell>Trạng thái đơn</TableCell>
              <TableCell align="center" sx={{ minWidth: 200, width: 200 }}>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">Đang tải...</Typography>
                </TableCell>
              </TableRow>
            )}
            {!loading && paginatedBookings.map((booking) => {
              const availableActions = getAvailableActions(booking);
              
              return (
                <TableRow key={booking.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {booking.reservationCode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {booking.customerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {booking.customerEmail}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{booking.checkIn}</TableCell>
                  <TableCell>{booking.checkOut}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(booking.reservationStatus)}
                      color={getStatusColor(booking.reservationStatus)}
                      size="small"
                      icon={STATUS_CONFIG[booking.reservationStatus]?.icon}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ minWidth: 200 }}>
                    <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                      {availableActions.map((action: string) => (
                        <Tooltip key={action} title={STATUS_CONFIG[action as ReservationStatus]?.label}>
                          <Button
                            size="small"
                            variant="outlined"
                            color={getStatusColor(action as ReservationStatus)}
                            onClick={() => openActionDialog(booking, action)}
                            startIcon={STATUS_CONFIG[action as ReservationStatus]?.icon}
                            sx={{
                              minWidth: 100,
                              height: 32,
                              fontSize: '0.75rem',
                              textTransform: 'none',
                              fontWeight: 500,
                            }}
                          >
                            {action === "approved" ? "Duyệt" : action === "rejected" ? "Từ chối" : action}
                          </Button>
                        </Tooltip>
                      ))}
                      <Tooltip title="Xem chi tiết">
                        <IconButton 
                          size="small" 
                          color="info"
                          onClick={() => viewBookingDetail(booking)}
                          sx={{
                            width: 32,
                            height: 32,
                            ml: 0.5
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
            {!loading && paginatedBookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">
                    Không có dữ liệu
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Controls */}
      {filteredBookings.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredBookings.length)} trong {filteredBookings.length} kết quả
            </Typography>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                displayEmpty
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">
              dòng/trang
            </Typography>
          </Box>
          
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
            size="small"
          />
        </Box>
      )}

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialog} onClose={() => setActionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Xác nhận thay đổi trạng thái
        </DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Bạn có chắc chắn muốn thay đổi trạng thái booking <strong>{selectedBooking.reservationCode}</strong>?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Khách hàng: {selectedBooking.customerName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Từ: <Chip label={getStatusLabel(selectedBooking.reservationStatus)} color={getStatusColor(selectedBooking.reservationStatus)} size="small" />
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Thành: <Chip label={STATUS_CONFIG[actionType as keyof typeof STATUS_CONFIG]?.label} color={getStatusColor(actionType as ReservationStatus)} size="small" />
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(false)}>
            Hủy
          </Button>
          <Button 
            variant="contained" 
            color={getStatusColor(actionType as ReservationStatus)}
            onClick={() => selectedBooking && handleStatusChange(selectedBooking.id, actionType)}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
