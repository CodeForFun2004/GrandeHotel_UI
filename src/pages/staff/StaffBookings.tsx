import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Tooltip,
  Divider,
  Snackbar,
  Alert as MuiAlert,
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  AccessTime,
  Edit as EditIcon,
  PlaylistAdd as PlaylistAddIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  DeleteOutline as DeleteOutlineIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { formatVND } from "../../utils/formatCurrency";

/* =========================
   Types
   ========================= */
type BookingStatus = "confirmed" | "pending" | "cancelled";

type ServiceCatalogItem = {
  Service_ID: number;
  Name: string;
  Price: number; // VND
};

type BookingService = {
  Service_ID: number;
  Name: string;
  UnitPrice: number;
  Qty: number;
};

type Booking = {
  Reservation_ID: string;
  Stay_ID?: string;          // có Stay_ID => đã check-in
  CustomerName: string;
  Phone?: string;
  RoomTypeName: "Standard" | "Deluxe" | "Suite";
  RoomNumber?: string;
  CheckIn: string; // yyyy-MM-dd
  CheckOut: string; // yyyy-MM-dd
  Status: BookingStatus;
  NightRate: number; // VND
  Services: BookingService[];
};

/* =========================
   Mock catalogs
   ========================= */
const SERVICE_CATALOG: ServiceCatalogItem[] = [
  { Service_ID: 1, Name: "Ăn sáng", Price: 120_000 },
  { Service_ID: 2, Name: "Đưa đón sân bay", Price: 250_000 },
  { Service_ID: 3, Name: "Giặt ủi (kg)", Price: 60_000 },
  { Service_ID: 4, Name: "Nước suối 500ml", Price: 20_000 },
  { Service_ID: 5, Name: "Mini bar (set)", Price: 150_000 },
];

// Đơn giá gốc theo loại phòng (giả lập)
const ROOM_TYPE_PRICE: Record<Booking["RoomTypeName"], number> = {
  Standard: 1_200_000,
  Deluxe: 1_800_000,
  Suite: 2_700_000,
};

// Phòng khả dụng theo loại (giả lập; chỉ hiển thị cho New Booking)
const AVAILABLE_ROOMS_BY_TYPE: Record<Booking["RoomTypeName"], string[]> = {
  Standard: ["101", "103", "203"],
  Deluxe: ["102", "202"],
  Suite: ["201"],
};

/* =========================
   Seed bookings
   ========================= */
const INITIAL_BOOKINGS: Booking[] = [
  {
    Reservation_ID: "RSV-1001",
    Stay_ID: "STAY-9001", // đã check-in -> sẽ enable Checkout
    CustomerName: "John Doe",
    Phone: "0900000001",
    RoomTypeName: "Standard",
    RoomNumber: "101",
    CheckIn: "2024-01-15",
    CheckOut: "2024-01-18",
    Status: "confirmed",
    NightRate: ROOM_TYPE_PRICE.Standard,
    Services: [
      { Service_ID: 1, Name: "Ăn sáng", UnitPrice: 120_000, Qty: 2 },
      { Service_ID: 4, Name: "Nước suối 500ml", UnitPrice: 20_000, Qty: 4 },
    ],
  },
  {
    Reservation_ID: "RSV-1002",
    CustomerName: "Jane Smith",
    Phone: "0900000002",
    RoomTypeName: "Deluxe",
    RoomNumber: "102",
    CheckIn: "2024-01-16",
    CheckOut: "2024-01-20",
    Status: "pending",
    NightRate: ROOM_TYPE_PRICE.Deluxe,
    Services: [{ Service_ID: 1, Name: "Ăn sáng", UnitPrice: 120_000, Qty: 4 }],
  },
  {
    Reservation_ID: "RSV-1003",
    CustomerName: "Bob Johnson",
    Phone: "0900000003",
    RoomTypeName: "Suite",
    RoomNumber: "201",
    CheckIn: "2024-01-14",
    CheckOut: "2024-01-16",
    Status: "cancelled",
    NightRate: ROOM_TYPE_PRICE.Suite,
    Services: [],
  },
  {
    Reservation_ID: "RSV-1004",
    CustomerName: "Alice Brown",
    Phone: "0900000004",
    RoomTypeName: "Standard",
    RoomNumber: "103",
    CheckIn: "2024-01-17",
    CheckOut: "2024-01-19",
    Status: "confirmed",
    NightRate: ROOM_TYPE_PRICE.Standard,
    Services: [{ Service_ID: 5, Name: "Mini bar (set)", UnitPrice: 150_000, Qty: 1 }],
  },
];

/* =========================
   Helpers
   ========================= */
const statusColor = (s: BookingStatus) =>
  s === "confirmed" ? "success" : s === "pending" ? "warning" : "error";

const statusIcon = (s: BookingStatus) =>
  s === "confirmed" ? <CheckCircle /> : s === "pending" ? <AccessTime /> : <Cancel />;

const calcNights = (ci: string, co: string) => {
  const a = new Date(ci);
  const b = new Date(co);
  const diff = Math.round((+b - +a) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff);
};

const calcServiceTotal = (svs: BookingService[]) =>
  svs.reduce((sum, x) => sum + x.UnitPrice * x.Qty, 0);

const calcBookingTotal = (b: Booking) =>
  b.NightRate * calcNights(b.CheckIn, b.CheckOut) + calcServiceTotal(b.Services);

// yyyy-MM-dd tiện nhập TextField type="date"
const toISODate = (d: Date) => d.toISOString().slice(0, 10);

/* =========================
   Component
   ========================= */
const StaffBookings: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Booking[]>(INITIAL_BOOKINGS);

  /* Snackbar */
  const [snack, setSnack] = useState<{ open: boolean; msg: string; type: "success" | "info" | "error" }>({
    open: false,
    msg: "",
    type: "success",
  });

  /* ------- Dialog: Edit Services (per booking) ------- */
  const [openServiceDlg, setOpenServiceDlg] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);

  const [servicePick, setServicePick] = useState<number>(SERVICE_CATALOG[0].Service_ID);
  const [serviceQty, setServiceQty] = useState<number>(1);

  const currentBooking = useMemo(
    () => (editIdx != null ? rows[editIdx] : null),
    [editIdx, rows]
  );

  const openEditServices = (idx: number) => {
    setEditIdx(idx);
    setOpenServiceDlg(true);
    setServicePick(SERVICE_CATALOG[0].Service_ID);
    setServiceQty(1);
  };

  const addServiceToCurrent = () => {
    if (editIdx == null) return;
    const svc = SERVICE_CATALOG.find((s) => s.Service_ID === servicePick)!;
    setRows((prev) => {
      const clone = [...prev];
      const target = { ...clone[editIdx] };
      const exist = target.Services.find((x) => x.Service_ID === svc.Service_ID);
      if (exist) {
        exist.Qty += serviceQty;
      } else {
        target.Services = [
          ...target.Services,
          { Service_ID: svc.Service_ID, Name: svc.Name, UnitPrice: svc.Price, Qty: serviceQty },
        ];
      }
      clone[editIdx] = target;
      return clone;
    });
    setServiceQty(1);
  };

  const updateServiceQty = (serviceId: number, qty: number) => {
    if (editIdx == null) return;
    setRows((prev) => {
      const clone = [...prev];
      const target = { ...clone[editIdx] };
      target.Services = target.Services
        .map((s) => (s.Service_ID === serviceId ? { ...s, Qty: Math.max(0, qty) } : s))
        .filter((s) => s.Qty > 0);
      clone[editIdx] = target;
      return clone;
    });
  };

  const removeService = (serviceId: number) => {
    if (editIdx == null) return;
    setRows((prev) => {
      const clone = [...prev];
      const target = { ...clone[editIdx] };
      target.Services = target.Services.filter((s) => s.Service_ID !== serviceId);
      clone[editIdx] = target;
      return clone;
    });
  };

  /* ------- Actions trên mỗi hàng ------- */
  const cancelBooking = (idx: number) => {
    setRows((prev) => {
      const clone = [...prev];
      clone[idx] = { ...clone[idx], Status: "cancelled" };
      return clone;
    });
    setSnack({ open: true, msg: "Đã hủy booking.", type: "info" });
  };

  const createStayAndCheckIn = (idx: number) => {
    setRows((prev) => {
      const clone = [...prev];
      const b = clone[idx];
      if (b.Status === "cancelled" || b.Stay_ID) return clone;

      const stayId = `STAY-${Date.now()}`;
      // cập nhật state để khi quay lại list sẽ thấy nút Checkout enable
      clone[idx] = { ...b, Stay_ID: stayId };

      // mapping data để truyền sang Check-in (UI-only)
      const checkInData = {
        code: b.Reservation_ID,
        guestName: b.CustomerName,
        phone: b.Phone || "",
        email: "",
        roomType: b.RoomTypeName,
        roomNumber: b.RoomNumber || "",
        adults: 2,
        children: 0,
        checkIn: b.CheckIn,
        checkOut: b.CheckOut,
        pricePerNight: b.NightRate,
        source: "Direct" as const,
        note: "",
        stayId,
      };

      // Điều hướng
      setSnack({ open: true, msg: "Đã tạo Stay (mock) và chuyển tới Check-in.", type: "success" });
      navigate("/staff/checkin", { state: { bookingData: checkInData } });

      return clone;
    });
  };

  const goToCheckout = (idx: number) => {
    const booking = rows[idx];
    if (!booking.Stay_ID) return;

    // Tính số đêm đã lưu trú (từ CheckIn đến hôm nay)
    const checkInDate = new Date(booking.CheckIn);
    const today = new Date();
    const nightsSoFar = Math.max(1, Math.ceil((today.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Map Services từ Booking sang FolioItem format (PREPOSTED_LINES)
    const prepostedServices = booking.Services.map((svc, idx) => ({
      id: `svc-${idx}`,
      type: "service" as const,
      desc: svc.Name,
      qty: svc.Qty,
      amount: svc.UnitPrice,
      source: "WEB_ADDON" as const, // Giả sử services từ booking là web add-on
      status: "POSTED" as const,
      ts: `${booking.CheckIn} 14:00`,
      by: "system",
      note: "Đặt kèm từ booking",
    }));

    // Map booking data sang format của Check-out (InHouse type)
    const checkOutData = {
      stayId: booking.Stay_ID,
      guestName: booking.CustomerName,
      phone: booking.Phone || "",
      email: "", // StaffBookings không có email
      roomType: booking.RoomTypeName,
      roomNumber: booking.RoomNumber || "",
      checkIn: `${booking.CheckIn} 14:00`, // thêm giờ mặc định
      checkOutPlan: `${booking.CheckOut} 12:00`,
      pricePerNight: booking.NightRate,
      nightsSoFar: nightsSoFar,
      deposit: 2_000_000, // mock deposit, có thể lưu trong booking sau
      prepostedServices, // Truyền thêm services để Check-out có thể load
    };

    setSnack({ open: true, msg: `Chuyển tới Check-out cho ${booking.Stay_ID}`, type: "info" });
    // Truyền data qua state
    navigate("/staff/checkout", { state: { stayData: checkOutData } });
  };

  /* ------- Dialog: New Booking (walk-in) ------- */
  const [openNewDlg, setOpenNewDlg] = useState(false);
  const [nbName, setNbName] = useState("");
  const [nbPhone, setNbPhone] = useState("");
  const [nbType, setNbType] = useState<Booking["RoomTypeName"]>("Standard");
  const [nbRoom, setNbRoom] = useState<string>("");
  const [nbCheckIn, setNbCheckIn] = useState<string>(() => toISODate(new Date()));
  const [nbCheckOut, setNbCheckOut] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toISODate(d);
  });
  const [nbNightRate, setNbNightRate] = useState<number>(ROOM_TYPE_PRICE.Standard);
  const [nbServices, setNbServices] = useState<BookingService[]>([]);

  // picker trong dialog New Booking
  const [nbSvcPick, setNbSvcPick] = useState<number>(SERVICE_CATALOG[0].Service_ID);
  const [nbSvcQty, setNbSvcQty] = useState<number>(1);

  const nbRoomsForType = AVAILABLE_ROOMS_BY_TYPE[nbType];

  const addServiceToNew = () => {
    const svc = SERVICE_CATALOG.find((s) => s.Service_ID === nbSvcPick)!;
    setNbServices((prev) => {
      const exist = prev.find((x) => x.Service_ID === svc.Service_ID);
      if (exist) {
        return prev.map((x) =>
          x.Service_ID === svc.Service_ID ? { ...x, Qty: x.Qty + nbSvcQty } : x
        );
      }
      return [...prev, { Service_ID: svc.Service_ID, Name: svc.Name, UnitPrice: svc.Price, Qty: nbSvcQty }];
    });
    setNbSvcQty(1);
  };

  const updateNewQty = (serviceId: number, qty: number) => {
    setNbServices((prev) =>
      prev
        .map((s) => (s.Service_ID === serviceId ? { ...s, Qty: Math.max(0, qty) } : s))
        .filter((s) => s.Qty > 0)
    );
  };

  const removeNewSvc = (serviceId: number) =>
    setNbServices((prev) => prev.filter((s) => s.Service_ID !== serviceId));

  const resetNewForm = () => {
    setNbName("");
    setNbPhone("");
    setNbType("Standard");
    setNbNightRate(ROOM_TYPE_PRICE.Standard);
    setNbRoom("");
    setNbCheckIn(toISODate(new Date()));
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setNbCheckOut(toISODate(d));
    setNbServices([]);
    setNbSvcPick(SERVICE_CATALOG[0].Service_ID);
    setNbSvcQty(1);
  };

  const createNewBooking = () => {
    if (!nbName.trim() || !nbRoom || !nbCheckIn || !nbCheckOut) {
      setSnack({ open: true, msg: "Vui lòng nhập đầy đủ thông tin bắt buộc.", type: "error" });
      return;
    }
    const Reservation_ID = `RSV-${Date.now()}`;
    const newRow: Booking = {
      Reservation_ID,
      CustomerName: nbName.trim(),
      Phone: nbPhone.trim(),
      RoomTypeName: nbType,
      RoomNumber: nbRoom,
      CheckIn: nbCheckIn,
      CheckOut: nbCheckOut,
      Status: "confirmed", // walk-in tại quầy có thể xác nhận luôn
      NightRate: nbNightRate,
      Services: nbServices,
    };
    setRows((prev) => [newRow, ...prev]);
    setOpenNewDlg(false);
    setSnack({ open: true, msg: "Đã tạo booking tại quầy.", type: "success" });
    resetNewForm();
  };

  // sync night rate khi đổi loại phòng
  React.useEffect(() => {
    setNbNightRate(ROOM_TYPE_PRICE[nbType]);
    // nếu phòng đang chọn không thuộc loại mới -> clear
    if (nbRoom && !AVAILABLE_ROOMS_BY_TYPE[nbType].includes(nbRoom)) {
      setNbRoom("");
    }
  }, [nbType]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5" fontWeight={800} sx={{ color: "#b8192b" }}>
          Bookings
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#b8192b" }}
            onClick={() => setOpenNewDlg(true)}
          >
            New Booking
          </Button>
        </Stack>
      </Box>

      {/* Card wrapper cho table (đồng bộ style) */}
      <Card sx={{ boxShadow: "0 4px 6px rgba(0,0,0,0.08)" }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} elevation={0}>
            <Table sx={{ minWidth: 980 }} aria-label="bookings table">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: 800 }}>Reservation</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Room / Type</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Check-in</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Check-out</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Nights</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Services</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((b, idx) => {
                  const nights = calcNights(b.CheckIn, b.CheckOut);
                  const total = calcBookingTotal(b);
                  const checkedIn = Boolean(b.Stay_ID);
                  const isCancelled = b.Status === "cancelled";

                  return (
                    <TableRow key={b.Reservation_ID} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <span>#{b.Reservation_ID}</span>
                          {checkedIn && (
                            <Chip size="small" color="success" variant="outlined" label={`Stay: ${b.Stay_ID}`} />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Typography variant="body2">{b.CustomerName}</Typography>
                          {b.Phone && (
                            <Typography variant="caption" color="text.secondary">
                              {b.Phone}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Typography variant="body2">{b.RoomNumber ? `Phòng ${b.RoomNumber}` : "—"}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {b.RoomTypeName} • {formatVND(b.NightRate)}/đêm
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{b.CheckIn}</TableCell>
                      <TableCell>{b.CheckOut}</TableCell>
                      <TableCell>{nights}</TableCell>
                      <TableCell>
                        {b.Services.length ? (
                          <Stack direction="row" gap={0.5} flexWrap="wrap">
                            {b.Services.slice(0, 3).map((s) => (
                              <Chip key={s.Service_ID} size="small" label={`${s.Name} x${s.Qty}`} variant="outlined" />
                            ))}
                            {b.Services.length > 3 && <Chip size="small" label={`+${b.Services.length - 3}`} />}
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Không có
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: "#b8192b" }}>
                        {formatVND(total)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={statusIcon(b.Status)}
                          label={b.Status.charAt(0).toUpperCase() + b.Status.slice(1)}
                          color={statusColor(b.Status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                          {/* Sửa/Thêm dịch vụ (UI-only) */}
                          <Tooltip title="Sửa dịch vụ">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => openEditServices(idx)}
                                disabled={isCancelled}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Thêm nhanh dịch vụ">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => openEditServices(idx)}
                                disabled={isCancelled}
                              >
                                <PlaylistAddIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>

                          {/* Check-in / Check-out theo Stay_ID */}
                          <Tooltip title={checkedIn ? "Đã check-in" : "Tạo Stay & Check-in"}>
                            <span>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<LoginIcon />}
                                onClick={() => createStayAndCheckIn(idx)}
                                disabled={checkedIn || isCancelled}
                              >
                                Check-in
                              </Button>
                            </span>
                          </Tooltip>

                          <Tooltip title={checkedIn ? "Đi tới Check-out" : "Chưa check-in"}>
                            <span>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<LogoutIcon />}
                                onClick={() => checkedIn && goToCheckout(idx)}
                                disabled={!checkedIn || isCancelled}
                              >
                                Check-out
                              </Button>
                            </span>
                          </Tooltip>

                          {/* Hủy booking */}
                          <Tooltip title="Hủy booking">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => cancelBooking(idx)}
                                disabled={isCancelled}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {!rows.length && (
                  <TableRow>
                    <TableCell colSpan={10}>
                      <Typography variant="body2" color="text.secondary">
                        Không có booking nào.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog: chỉnh services cho booking hiện có */}
      <Dialog open={openServiceDlg} onClose={() => setOpenServiceDlg(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sửa dịch vụ cho #{currentBooking?.Reservation_ID}</DialogTitle>
        <DialogContent dividers>
          {currentBooking ? (
            <>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
                <FormControl fullWidth>
                  <InputLabel>Dịch vụ</InputLabel>
                  <Select
                    label="Dịch vụ"
                    value={servicePick}
                    onChange={(e) => setServicePick(Number(e.target.value))}
                  >
                    {SERVICE_CATALOG.map((x) => (
                      <MenuItem key={x.Service_ID} value={x.Service_ID}>
                        {x.Name} — {formatVND(x.Price)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Số lượng"
                  type="number"
                  value={serviceQty}
                  onChange={(e) => setServiceQty(Math.max(1, Number(e.target.value)))}
                  sx={{ width: 140 }}
                />
                <Button variant="contained" onClick={addServiceToCurrent} sx={{ backgroundColor: "#b8192b", whiteSpace: "nowrap" }}>
                  Thêm
                </Button>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Danh sách dịch vụ đã chọn
              </Typography>
              {currentBooking.Services.length ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Dịch vụ</TableCell>
                      <TableCell>Đơn giá</TableCell>
                      <TableCell>Số lượng</TableCell>
                      <TableCell>Tổng</TableCell>
                      <TableCell align="right">Xóa</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentBooking.Services.map((s) => (
                      <TableRow key={s.Service_ID}>
                        <TableCell>{s.Name}</TableCell>
                        <TableCell>{formatVND(s.UnitPrice)}</TableCell>
                        <TableCell sx={{ maxWidth: 100 }}>
                          <TextField
                            size="small"
                            type="number"
                            value={s.Qty}
                            onChange={(e) => updateServiceQty(s.Service_ID, Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>{formatVND(s.UnitPrice * s.Qty)}</TableCell>
                        <TableCell align="right">
                          <Button size="small" color="error" onClick={() => removeService(s.Service_ID)}>
                            Xóa
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right" sx={{ fontWeight: 700 }}>
                        Tổng dịch vụ
                      </TableCell>
                      <TableCell colSpan={2} sx={{ fontWeight: 800, color: "#b8192b" }}>
                        {formatVND(calcServiceTotal(currentBooking.Services))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Chưa có dịch vụ nào.
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Không có dữ liệu.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenServiceDlg(false)}>Đóng</Button>
          <Button variant="contained" onClick={() => setOpenServiceDlg(false)} sx={{ backgroundColor: "#b8192b" }}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: New Booking (walk-in tại quầy) */}
      <Dialog open={openNewDlg} onClose={() => setOpenNewDlg(false)} maxWidth="md" fullWidth>
        <DialogTitle>Tạo booking tại quầy</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Họ tên khách *"
                fullWidth
                value={nbName}
                onChange={(e) => setNbName(e.target.value)}
              />
              <TextField
                label="SĐT"
                fullWidth
                value={nbPhone}
                onChange={(e) => setNbPhone(e.target.value)}
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Loại phòng</InputLabel>
                <Select
                  label="Loại phòng"
                  value={nbType}
                  onChange={(e) => setNbType(e.target.value as any)}
                >
                  <MenuItem value="Standard">Standard — {formatVND(ROOM_TYPE_PRICE.Standard)}/đêm</MenuItem>
                  <MenuItem value="Deluxe">Deluxe — {formatVND(ROOM_TYPE_PRICE.Deluxe)}/đêm</MenuItem>
                  <MenuItem value="Suite">Suite — {formatVND(ROOM_TYPE_PRICE.Suite)}/đêm</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Số phòng</InputLabel>
                <Select
                  label="Số phòng"
                  value={nbRoom}
                  onChange={(e) => setNbRoom(e.target.value)}
                >
                  {nbRoomsForType.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Đơn giá/đêm"
                fullWidth
                value={formatVND(ROOM_TYPE_PRICE[nbType])}
                InputProps={{ readOnly: true }}
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Check-in"
                type="date"
                fullWidth
                value={nbCheckIn}
                onChange={(e) => setNbCheckIn(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Check-out"
                type="date"
                fullWidth
                value={nbCheckOut}
                onChange={(e) => setNbCheckOut(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Số đêm"
                fullWidth
                value={calcNights(nbCheckIn, nbCheckOut)}
                InputProps={{ readOnly: true }}
              />
            </Stack>

            <Divider />

            <Typography variant="subtitle2">Dịch vụ kèm theo</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
              <FormControl fullWidth>
                <InputLabel>Dịch vụ</InputLabel>
                <Select
                  label="Dịch vụ"
                  value={nbSvcPick}
                  onChange={(e) => setNbSvcPick(Number(e.target.value))}
                >
                  {SERVICE_CATALOG.map((x) => (
                    <MenuItem key={x.Service_ID} value={x.Service_ID}>
                      {x.Name} — {formatVND(x.Price)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Số lượng"
                type="number"
                value={nbSvcQty}
                onChange={(e) => setNbSvcQty(Math.max(1, Number(e.target.value)))}
                sx={{ width: 140 }}
              />
              <Button variant="contained" onClick={() => addServiceToNew()} sx={{ backgroundColor: "#b8192b" }}>
                Thêm
              </Button>
            </Stack>

            {nbServices.length ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Dịch vụ</TableCell>
                    <TableCell>Đơn giá</TableCell>
                    <TableCell>Số lượng</TableCell>
                    <TableCell>Tổng</TableCell>
                    <TableCell align="right">Xóa</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {nbServices.map((s) => (
                    <TableRow key={s.Service_ID}>
                      <TableCell>{s.Name}</TableCell>
                      <TableCell>{formatVND(s.UnitPrice)}</TableCell>
                      <TableCell sx={{ maxWidth: 100 }}>
                        <TextField
                          size="small"
                          type="number"
                          value={s.Qty}
                          onChange={(e) => updateNewQty(s.Service_ID, Number(e.target.value))}
                        />
                      </TableCell>
                      <TableCell>{formatVND(s.UnitPrice * s.Qty)}</TableCell>
                      <TableCell align="right">
                        <Button size="small" color="error" onClick={() => removeNewSvc(s.Service_ID)}>
                          Xóa
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} align="right" sx={{ fontWeight: 700 }}>
                      Tổng dịch vụ
                    </TableCell>
                    <TableCell colSpan={2} sx={{ fontWeight: 800, color: "#b8192b" }}>
                      {formatVND(calcServiceTotal(nbServices))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Chưa có dịch vụ nào.
              </Typography>
            )}

            <Divider />

            <Stack direction="row" justifyContent="flex-end" spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Tạm tính:{" "}
                <b>
                  {formatVND(
                    ROOM_TYPE_PRICE[nbType] * calcNights(nbCheckIn, nbCheckOut) + calcServiceTotal(nbServices)
                  )}
                </b>
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewDlg(false)}>Đóng</Button>
          <Button variant="contained" onClick={createNewBooking} sx={{ backgroundColor: "#b8192b" }}>
            Tạo booking
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={2200}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <MuiAlert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.type}
          variant="filled"
          elevation={3}
          sx={{ width: "100%" }}
        >
          {snack.msg}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default StaffBookings;
