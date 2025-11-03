import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import {
  ArrowBack,
  Edit,
  Print,
  Email,
  Phone,
  AttachMoney,
  Person,
  CheckCircle,
  Cancel,
  Payment,
  Login,
  Logout,
} from "@mui/icons-material";
import { getReservationById as apiGetReservationById, approveReservation as apiApproveReservation } from "../../api/reservation";

// Types
interface Booking {
  id: string;
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  roomType: string; // summary of room types
  roomTypeList?: Array<{ name: string; quantity: number }>; // detailed list for display
  roomNumber: string; // optional display
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  status: "pending" | "approved" | "rejected" | "paid" | "checked-in" | "checked-out" | "canceled";
  createdAt: string;
  paymentMethod?: string;
  specialRequests?: string;
  adults: number;
  children: number;
  services?: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  notes?: string;
}

const STATUS_CONFIG = {
  pending: { label: "Chờ duyệt", color: "warning" as const, icon: <CheckCircle /> },
  approved: { label: "Đã duyệt", color: "info" as const, icon: <CheckCircle /> },
  rejected: { label: "Từ chối", color: "error" as const, icon: <Cancel /> },
  canceled: { label: "Đã hủy", color: "error" as const, icon: <Cancel /> },
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
  canceled: [],
  "checked-out": [],
};

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState(false);
  const [actionType, setActionType] = useState<string>("");

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        if (!id) return;
        const data = await apiGetReservationById(id);
        const r = data?.reservation;
        const statusFromStay = r?.stayStatus === 'checked_out'
          ? 'checked-out'
          : r?.stayStatus === 'checked_in'
          ? 'checked-in'
          : undefined;
        const paymentStatus = r?.payment?.paymentStatus;
        const isPaid = paymentStatus === 'fully_paid';
        const status: Booking["status"] = (statusFromStay as any) || (isPaid ? 'paid' : r?.status) || 'pending';
        // Build room type list and summary
        let roomTypeList: Array<{ name: string; quantity: number }> = [];
        if (Array.isArray(r?.details)) {
          const counts = new Map<string, number>();
          for (const d of r.details) {
            const name = d?.roomType?.name ?? 'Loại phòng';
            const qty = Number(d?.quantity ?? 1);
            counts.set(name, (counts.get(name) || 0) + qty);
          }
          roomTypeList = Array.from(counts.entries()).map(([name, quantity]) => ({ name, quantity }));
        }
        const roomTypeSummary = roomTypeList.length
          ? roomTypeList.map(rt => `${rt.name} x${rt.quantity}`).join(', ')
          : '';
        const adults = Array.isArray(r?.details) ? r.details.reduce((sum: number, d: any) => sum + (d?.adults ?? 0), 0) : r?.numberOfGuests ?? 0;
        const children = Array.isArray(r?.details) ? r.details.reduce((sum: number, d: any) => sum + (d?.children ?? 0), 0) : 0;

        const mapped: Booking = {
          id: r?._id,
          bookingCode: (r?._id || '').slice(-6).toUpperCase(),
          customerName: r?.customer?.fullname || r?.customer?.username || 'Khách lẻ',
          customerEmail: r?.customer?.email || '-',
          customerPhone: r?.customer?.phone || '-',
          roomType: roomTypeSummary,
          roomTypeList,
          roomNumber: '-',
          checkIn: r?.checkInDate ? new Date(r.checkInDate).toISOString().slice(0, 10) : '-',
          checkOut: r?.checkOutDate ? new Date(r.checkOutDate).toISOString().slice(0, 10) : '-',
          totalAmount: Number(r?.payment?.totalPrice || 0),
          status,
          createdAt: r?.createdAt || '',
          paymentMethod: r?.payment?.paymentMethod,
          specialRequests: '',
          adults,
          children,
          services: [],
          notes: r?.reason || '',
        };
        setBooking(mapped);
      } catch (err) {
        console.error('Failed to fetch booking detail', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!booking) return;
    try {
      if (newStatus === 'approved') {
        await apiApproveReservation(booking.id, 'approve');
      } else if (newStatus === 'rejected') {
        await apiApproveReservation(booking.id, 'cancel', 'Rejected by manager');
      } else {
        // Other actions (paid, checked-in, checked-out) will be wired later
      }
      setBooking({ ...booking, status: newStatus as Booking["status"] });
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setActionDialog(false);
      setActionType("");
    }
  };

  const openActionDialog = (action: string) => {
    setActionType(action);
    setActionDialog(true);
  };

  const getStatusColor = (status: Booking["status"]) => {
    return STATUS_CONFIG[status]?.color || "secondary";
  };

  const getStatusLabel = (status: Booking["status"]) => {
    return STATUS_CONFIG[status]?.label || status;
  };

  const getAvailableActions = (booking: Booking) => {
    return STATUS_FLOW[booking.status] || [];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Parse fallback summary string like "Suite x1, Deluxe x2" -> [{name, quantity}]
  const parseRoomTypeSummary = (summary?: string): Array<{ name: string; quantity: number }> => {
    if (!summary) return [];
    return summary
      .split(",")
      .map((p) => p.trim())
      .map((part) => {
        // Find last occurrence of " x<number>"
        const match = part.match(/^(.*)\s+x(\d+)$/i);
        if (match) {
          return { name: match[1].trim(), quantity: Number(match[2]) };
        }
        return { name: part, quantity: 1 };
      })
      .filter((x) => x.name.length > 0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Đang tải...</Typography>
      </Box>
    );
  }

  if (!booking) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          Không tìm thấy booking
        </Typography>
        <Button onClick={() => navigate("/manager/bookings")} sx={{ mt: 2 }}>
          Quay lại danh sách
        </Button>
      </Box>
    );
  }

  const availableActions = getAvailableActions(booking);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate("/manager/bookings")} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" fontWeight={700} color="primary.main">
          Chi tiết đặt phòng
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Box display="flex" gap={2} mb={3}>
  {availableActions.map((action: string) => (
          <Button
            key={action}
            variant="contained"
            color={getStatusColor(action as Booking["status"])}
            startIcon={STATUS_CONFIG[action as keyof typeof STATUS_CONFIG]?.icon}
            onClick={() => openActionDialog(action)}
          >
            {action === "approved" ? "Duyệt" : 
             action === "rejected" ? "Từ chối" :
             action === "paid" ? "Thanh toán" :
             action === "checked-in" ? "Nhận phòng" :
             action === "checked-out" ? "Trả phòng" : action}
          </Button>
        ))}
        <Button variant="outlined" startIcon={<Edit />}>
          Chỉnh sửa
        </Button>
        <Button variant="outlined" startIcon={<Print />}>
          In hóa đơn
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* Booking Information */}
        <Box sx={{ flex: { xs: 1, md: 2 } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thông tin đặt phòng
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Mã booking
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {booking.bookingCode}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Trạng thái
                  </Typography>
                  <Chip
                    label={getStatusLabel(booking.status)}
                    color={getStatusColor(booking.status)}
                    icon={STATUS_CONFIG[booking.status]?.icon}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Ngày tạo
                  </Typography>
                  <Typography variant="body1">
                    {formatDateTime(booking.createdAt)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Phương thức thanh toán
                  </Typography>
                  <Typography variant="body1">
                    {booking.paymentMethod || "Chưa thanh toán"}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Room Information */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thông tin phòng
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                {/* Room type table-like display using MUI Table for reliable layout */}
                <Box sx={{ gridColumn: { xs: '1', sm: '1 / span 2' } }}>
                  {(() => {
                    const effectiveList = (booking.roomTypeList && booking.roomTypeList.length > 0)
                      ? booking.roomTypeList
                      : parseRoomTypeSummary(booking.roomType);
                    return (
                      <Table size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: 'action.hover' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Loại phòng</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align="right">Số phòng</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {effectiveList.length > 0 ? (
                            effectiveList.map((item, idx) => (
                              <TableRow key={`rt-${idx}`}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell align="right">{item.quantity}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={2} align="center">-</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    );
                  })()}
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Ngày nhận phòng
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(booking.checkIn)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Ngày trả phòng
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(booking.checkOut)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Số đêm
                  </Typography>
                  <Typography variant="body1">
                    {Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24))} đêm
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Số khách
                  </Typography>
                  <Typography variant="body1">
                    {booking.adults} người lớn, {booking.children} trẻ em
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Services */}
          {booking.services && booking.services.length > 0 && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Dịch vụ bổ sung
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <List>
                  {booking.services.map((service, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <AttachMoney />
                      </ListItemIcon>
                      <ListItemText
                        primary={service.name}
                        secondary={`${service.quantity} x $${service.price}`}
                      />
                      <Typography variant="body1" fontWeight="bold">
                        ${service.price * service.quantity}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {/* Special Requests & Notes */}
          {(booking.specialRequests || booking.notes) && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Yêu cầu đặc biệt & Ghi chú
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {booking.specialRequests && (
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Yêu cầu đặc biệt
                    </Typography>
                    <Typography variant="body1">
                      {booking.specialRequests}
                    </Typography>
                  </Box>
                )}
                
                {booking.notes && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Ghi chú
                    </Typography>
                    <Typography variant="body1">
                      {booking.notes}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Customer Information & Summary */}
        <Box sx={{ flex: { xs: 1, md: 1 } }}>
          {/* Customer Info */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Thông tin khách hàng
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ mr: 2, bgcolor: "primary.main" }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="h6">{booking.customerName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Khách hàng
                  </Typography>
                </Box>
              </Box>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Email />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={booking.customerEmail}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Phone />
                  </ListItemIcon>
                  <ListItemText
                    primary="Số điện thoại"
                    secondary={booking.customerPhone}
                  />
                </ListItem>
              </List>
              
              <Box mt={2}>
                <Button variant="outlined" fullWidth startIcon={<Email />}>
                  Gửi email
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tổng kết thanh toán
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Phòng ({booking.roomType})</Typography>
                <Typography variant="body2">${booking.totalAmount}</Typography>
              </Box>
              
              {booking.services?.map((service, index) => (
                <Box key={index} display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">{service.name}</Typography>
                  <Typography variant="body2">${service.price * service.quantity}</Typography>
                </Box>
              ))}
              
              <Divider sx={{ my: 1 }} />
              
              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6">Tổng cộng</Typography>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  ${booking.totalAmount}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialog} onClose={() => setActionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Xác nhận thay đổi trạng thái
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Bạn có chắc chắn muốn thay đổi trạng thái booking <strong>{booking.bookingCode}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Khách hàng: {booking.customerName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Từ: <Chip label={getStatusLabel(booking.status)} color={getStatusColor(booking.status)} size="small" />
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Thành: <Chip label={STATUS_CONFIG[actionType as keyof typeof STATUS_CONFIG]?.label} color={getStatusColor(actionType as Booking["status"])} size="small" />
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(false)}>
            Hủy
          </Button>
          <Button 
            variant="contained" 
            color={getStatusColor(actionType as Booking["status"])}
            onClick={() => handleStatusChange(actionType)}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
