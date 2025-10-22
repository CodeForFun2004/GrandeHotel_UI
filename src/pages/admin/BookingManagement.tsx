import { useState, useMemo } from "react";
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
  Payment,
  Login,
  Logout,
  Visibility,
} from "@mui/icons-material";

// Types
interface Booking {
  id: string;
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  status: "pending" | "approved" | "rejected" | "paid" | "checked-in" | "checked-out";
  createdAt: string;
  paymentMethod?: string;
}

// Mock data
const MOCK_BOOKINGS: Booking[] = [
  {
    id: "1",
    bookingCode: "BK001",
    customerName: "Nguyễn Văn A",
    customerEmail: "nguyenvana@email.com",
    roomType: "Suite Ocean",
    checkIn: "2024-01-15",
    checkOut: "2024-01-18",
    totalAmount: 660,
    status: "pending",
    createdAt: "2024-01-10",
  },
  {
    id: "2",
    bookingCode: "BK002",
    customerName: "Trần Thị B",
    customerEmail: "tranthib@email.com",
    roomType: "Deluxe Garden",
    checkIn: "2024-01-20",
    checkOut: "2024-01-22",
    totalAmount: 360,
    status: "approved",
    createdAt: "2024-01-12",
  },
  {
    id: "3",
    bookingCode: "BK003",
    customerName: "Lê Văn C",
    customerEmail: "levanc@email.com",
    roomType: "Family City",
    checkIn: "2024-01-25",
    checkOut: "2024-01-28",
    totalAmount: 600,
    status: "paid",
    paymentMethod: "Credit Card",
    createdAt: "2024-01-14",
  },
  {
    id: "4",
    bookingCode: "BK004",
    customerName: "Phạm Thị D",
    customerEmail: "phamthid@email.com",
    roomType: "Classic Cozy",
    checkIn: "2024-01-30",
    checkOut: "2024-02-02",
    totalAmount: 450,
    status: "checked-in",
    paymentMethod: "Bank Transfer",
    createdAt: "2024-01-16",
  },
  {
    id: "5",
    bookingCode: "BK005",
    customerName: "Hoàng Văn E",
    customerEmail: "hoangvane@email.com",
    roomType: "Suite Ocean",
    checkIn: "2024-01-05",
    checkOut: "2024-01-08",
    totalAmount: 660,
    status: "checked-out",
    paymentMethod: "Credit Card",
    createdAt: "2024-01-01",
  },
];

const STATUS_CONFIG = {
  pending: { label: "Chờ duyệt", color: "warning" as const, icon: <FilterList /> },
  approved: { label: "Đã duyệt", color: "info" as const, icon: <CheckCircle /> },
  rejected: { label: "Từ chối", color: "error" as const, icon: <Cancel /> },
  paid: { label: "Đã thanh toán", color: "success" as const, icon: <Payment /> },
  "checked-in": { label: "Đã nhận phòng", color: "primary" as const, icon: <Login /> },
  "checked-out": { label: "Đã trả phòng", color: "secondary" as const, icon: <Logout /> },
};

const STATUS_FLOW = {
  pending: ["approved", "rejected"],
  approved: ["paid"],
  paid: ["checked-in"],
  "checked-in": ["checked-out"],
  rejected: [],
  "checked-out": [],
};

export default function BookingManagement() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionDialog, setActionDialog] = useState(false);
  const [actionType, setActionType] = useState<string>("");
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesSearch = 
        booking.bookingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
      
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
    return STATUS_FLOW[booking.status] || [];
  };

  // Handle status change
  const handleStatusChange = (bookingId: string, newStatus: string) => {
    setBookings(prev => 
      prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus as Booking["status"] }
          : booking
      )
    );
    setActionDialog(false);
    setSelectedBooking(null);
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
  const getStatusColor = (status: Booking["status"]) => {
    return STATUS_CONFIG[status]?.color || "secondary";
  };

  // Get status label
  const getStatusLabel = (status: Booking["status"]) => {
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
              <TableCell>Mã booking</TableCell>
              <TableCell>Khách hàng</TableCell>
              <TableCell>Loại phòng</TableCell>
              <TableCell>Ngày nhận</TableCell>
              <TableCell>Ngày trả</TableCell>
              <TableCell>Tổng tiền</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="center" sx={{ minWidth: 200, width: 200 }}>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedBookings.map((booking) => {
              const availableActions = getAvailableActions(booking);
              
              return (
                <TableRow key={booking.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {booking.bookingCode}
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
                  <TableCell>{booking.roomType}</TableCell>
                  <TableCell>{booking.checkIn}</TableCell>
                  <TableCell>{booking.checkOut}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      ${booking.totalAmount}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(booking.status)}
                      color={getStatusColor(booking.status)}
                      size="small"
                      icon={STATUS_CONFIG[booking.status]?.icon}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ minWidth: 200 }}>
                    <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                      {availableActions.map((action) => (
                        <Tooltip key={action} title={STATUS_CONFIG[action as keyof typeof STATUS_CONFIG]?.label}>
                          <Button
                            size="small"
                            variant="outlined"
                            color={getStatusColor(action as Booking["status"])}
                            onClick={() => openActionDialog(booking, action)}
                            startIcon={STATUS_CONFIG[action as keyof typeof STATUS_CONFIG]?.icon}
                            sx={{
                              minWidth: 100,
                              height: 32,
                              fontSize: '0.75rem',
                              textTransform: 'none',
                              fontWeight: 500,
                            }}
                          >
                            {action === "approved" ? "Duyệt" : 
                             action === "rejected" ? "Từ chối" :
                             action === "paid" ? "Thanh toán" :
                             action === "checked-in" ? "Nhận phòng" :
                             action === "checked-out" ? "Trả phòng" : action}
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
            {paginatedBookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
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
                Bạn có chắc chắn muốn thay đổi trạng thái booking <strong>{selectedBooking.bookingCode}</strong>?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Khách hàng: {selectedBooking.customerName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Từ: <Chip label={getStatusLabel(selectedBooking.status)} color={getStatusColor(selectedBooking.status)} size="small" />
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Thành: <Chip label={STATUS_CONFIG[actionType as keyof typeof STATUS_CONFIG]?.label} color={getStatusColor(actionType as Booking["status"])} size="small" />
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
            color={getStatusColor(actionType as Booking["status"])}
            onClick={() => selectedBooking && handleStatusChange(selectedBooking.id, actionType)}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
