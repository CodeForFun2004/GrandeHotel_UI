import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Stack,
  IconButton,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert as MuiAlert,
} from "@mui/material";
import {
  Search,
  Person,
  Email,
  Phone,
  LocationOn,
  MoreVert,
  Edit as EditIcon,
  History as HistoryIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { formatVND } from "../../utils/formatCurrency";

/* =========================
   Unified constants (đồng bộ với Rooms/Bookings)
   ========================= */
type RoomTypeName = "Standard" | "Deluxe" | "Suite";
export const ROOM_TYPE_PRICE: Record<RoomTypeName, number> = {
  Standard: 1_200_000,
  Deluxe: 1_800_000,
  Suite: 2_700_000,
};

export const SERVICE_CATALOG = [
  { id: 1, name: "Ăn sáng", price: 120_000 },
  { id: 2, name: "Đưa đón sân bay", price: 250_000 },
  { id: 3, name: "Giặt ủi (kg)", price: 60_000 },
];

export const AVAILABLE_ROOMS: Record<RoomTypeName, string[]> = {
  Standard: ["101", "103", "203"],
  Deluxe: ["102", "202"],
  Suite: ["201"],
};

/* Staff đang làm ở khách sạn nào (UI-only, đồng bộ các page) */
const currentHotelId = 1;

/* =========================
   Types
   ========================= */
type AccountStatus = "active" | "inactive" | "banned";
type BookingStatus = "confirmed" | "pending" | "cancelled";

type Customer = {
  Account_ID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  PhoneNumber: string;
  Address?: string;
  Status: AccountStatus;
  AvatarURL?: string;
  TotalReservations: number;
  TotalStays: number;
  LastStay?: {
    Stay_ID: string;
    RoomNumber: string;
    CheckIn: string; // ISO
    CheckOut: string; // ISO
    Total: number; // VND
  };
};

type CustomerHistoryRow = {
  Reservation_ID: string;
  Stay_ID?: string;
  Hotel_ID: number;           // để lọc theo khách sạn staff
  RoomTypeName: RoomTypeName;
  RoomNumber?: string;
  CheckIn: string;
  CheckOut: string;
  Status: BookingStatus;      // trạng thái của reservation
  NightRate: number;          // VND
  Services: { Name: string; Qty: number; UnitPrice: number }[];
};

/* =========================
   MOCK DATA (đồng bộ quy ước ID/giá/rooms/services và Hotel_ID)
   ========================= */
const CUSTOMERS: Customer[] = [
  {
    Account_ID: 11,
    FirstName: "John",
    LastName: "Doe",
    Email: "john.doe@email.com",
    PhoneNumber: "0900000001",
    Address: "Hà Nội",
    Status: "active",
    TotalReservations: 6,
    TotalStays: 4,
    LastStay: {
      Stay_ID: "STAY-1101",
      RoomNumber: "507",
      CheckIn: "2025-10-18",
      CheckOut: "2025-10-20",
      Total: 5_600_000,
    },
  },
  {
    Account_ID: 12,
    FirstName: "Jane",
    LastName: "Smith",
    Email: "jane.smith@email.com",
    PhoneNumber: "0900000002",
    Address: "Đà Nẵng",
    Status: "active",
    TotalReservations: 3,
    TotalStays: 2,
  },
  {
    Account_ID: 13,
    FirstName: "Bob",
    LastName: "Johnson",
    Email: "bob.johnson@email.com",
    PhoneNumber: "0900000003",
    Address: "TP. HCM",
    Status: "inactive",
    TotalReservations: 1,
    TotalStays: 0,
  },
  {
    Account_ID: 14,
    FirstName: "Alice",
    LastName: "Brown",
    Email: "alice.brown@email.com",
    PhoneNumber: "0900000004",
    Address: "Nha Trang",
    Status: "active",
    TotalReservations: 7,
    TotalStays: 5,
  },
];

/* Lịch sử đồng bộ với Hotel_ID = 1, Room types, price, service catalog */
const HISTORY_BY_CUSTOMER: Record<number, CustomerHistoryRow[]> = {
  11: [
    {
      Reservation_ID: "RSV-1001",
      Stay_ID: "STAY-1101",
      Hotel_ID: 1,
      RoomTypeName: "Deluxe",
      RoomNumber: "507",
      CheckIn: "2025-10-18",
      CheckOut: "2025-10-20",
      Status: "confirmed",
      NightRate: ROOM_TYPE_PRICE.Deluxe,
      Services: [
        { Name: "Ăn sáng", Qty: 2, UnitPrice: 120_000 },
        { Name: "Giặt ủi (kg)", Qty: 1, UnitPrice: 60_000 },
      ],
    },
    {
      Reservation_ID: "RSV-0995",
      Hotel_ID: 1,
      RoomTypeName: "Standard",
      RoomNumber: "101",
      CheckIn: "2025-07-10",
      CheckOut: "2025-07-12",
      Status: "cancelled",
      NightRate: ROOM_TYPE_PRICE.Standard,
      Services: [],
    },
    {
      Reservation_ID: "RSV-0988",
      Stay_ID: "STAY-1080",
      Hotel_ID: 2, // khách sạn khác, sẽ bị lọc bỏ bởi currentHotelId
      RoomTypeName: "Suite",
      RoomNumber: "201",
      CheckIn: "2025-06-01",
      CheckOut: "2025-06-03",
      Status: "confirmed",
      NightRate: ROOM_TYPE_PRICE.Suite,
      Services: [{ Name: "Đưa đón sân bay", Qty: 1, UnitPrice: 250_000 }],
    },
  ],
  12: [
    {
      Reservation_ID: "RSV-1002",
      Stay_ID: "STAY-1102",
      Hotel_ID: 1,
      RoomTypeName: "Standard",
      RoomNumber: "103",
      CheckIn: "2025-08-01",
      CheckOut: "2025-08-03",
      Status: "confirmed",
      NightRate: ROOM_TYPE_PRICE.Standard,
      Services: [{ Name: "Ăn sáng", Qty: 2, UnitPrice: 120_000 }],
    },
  ],
  13: [],
  14: [
    {
      Reservation_ID: "RSV-0950",
      Stay_ID: "STAY-1050",
      Hotel_ID: 1,
      RoomTypeName: "Suite",
      RoomNumber: "201",
      CheckIn: "2025-03-12",
      CheckOut: "2025-03-15",
      Status: "confirmed",
      NightRate: ROOM_TYPE_PRICE.Suite,
      Services: [{ Name: "Đưa đón sân bay", Qty: 1, UnitPrice: 250_000 }],
    },
  ],
};

/* =========================
   Component
   ========================= */
const StaffCustomers: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Customer[]>(CUSTOMERS);

  /* search + filter */
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | AccountStatus>("ALL");

  const data = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return rows.filter((c) => {
      const matchKw =
        !kw ||
        `${c.FirstName} ${c.LastName}`.toLowerCase().includes(kw) ||
        c.Email.toLowerCase().includes(kw) ||
        c.PhoneNumber.includes(kw);
      const matchStatus = statusFilter === "ALL" || c.Status === statusFilter;
      return matchKw && matchStatus;
    });
  }, [rows, keyword, statusFilter]);

  /* dialog: detail/history */
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);

  const openDetail = (c: Customer) => {
    setDetailCustomer(c);
    setDetailOpen(true);
  };

  /* dialog: edit */
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Omit<Customer, "TotalReservations" | "TotalStays" | "LastStay"> | null>(null);

  const openEdit = (c: Customer) => {
    setEditForm({
      Account_ID: c.Account_ID,
      FirstName: c.FirstName,
      LastName: c.LastName,
      Email: c.Email,
      PhoneNumber: c.PhoneNumber,
      Address: c.Address,
      Status: c.Status,
      AvatarURL: c.AvatarURL,
    });
    setEditOpen(true);
  };

  const saveEdit = () => {
    if (!editForm) return;
    setRows((prev) =>
      prev.map((c) =>
        c.Account_ID === editForm.Account_ID
          ? { ...c, ...editForm }
          : c
      )
    );
    setEditOpen(false);
    setSnack({ open: true, type: "success", msg: "Đã lưu thông tin khách hàng (UI only)." });
  };

  /* dialog: new booking */
  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState<{
    customer?: Customer;
    roomType: RoomTypeName;
    roomNumber: string;
    checkIn: string;
    checkOut: string;
    services: { id: number; name: string; price: number; qty: number }[];
  }>({
    roomType: "Standard",
    roomNumber: "",
    checkIn: toISO(new Date()),
    checkOut: toISO(addDays(new Date(), 1)),
    services: [],
  });

  const openNewBooking = (c: Customer) => {
    setNewForm({
      customer: c,
      roomType: "Standard",
      roomNumber: "",
      checkIn: toISO(new Date()),
      checkOut: toISO(addDays(new Date(), 1)),
      services: [],
    });
    setNewOpen(true);
  };

  const addServiceToNew = (svcId: number, qty: number) => {
    const svc = SERVICE_CATALOG.find((s) => s.id === svcId)!;
    setNewForm((f) => {
      if (!f) return f;
      const exist = f.services.find((x) => x.id === svc.id);
      if (exist) {
        exist.qty += qty;
        return { ...f, services: [...f.services] };
      }
      return { ...f, services: [...f.services, { id: svc.id, name: svc.name, price: svc.price, qty }] };
    });
  };

  const updateQtyNew = (svcId: number, qty: number) => {
    setNewForm((f) => {
      if (!f) return f;
      const arr = f.services
        .map((x) => (x.id === svcId ? { ...x, qty: Math.max(0, qty) } : x))
        .filter((x) => x.qty > 0);
      return { ...f, services: arr };
    });
  };

  const removeSvcNew = (svcId: number) => {
    setNewForm((f) => (f ? { ...f, services: f.services.filter((x) => x.id !== svcId) } : f));
  };

  const totalNewBooking = useMemo(() => {
    const nights = diffNights(newForm.checkIn, newForm.checkOut);
    const roomTotal = ROOM_TYPE_PRICE[newForm.roomType] * nights;
    const svcTotal = newForm.services.reduce((s, x) => s + x.price * x.qty, 0);
    return roomTotal + svcTotal;
  }, [newForm]);

  const createNewBooking = () => {
    setSnack({
      open: true,
      type: "success",
      msg: `Đã tạo booking tại quầy cho ${fullName(newForm.customer!)} (UI only).`,
    });
    setNewOpen(false);
  };

  /* Snackbar */
  const [snack, setSnack] = useState<{ open: boolean; type: "success" | "info" | "error"; msg: string }>({
    open: false,
    type: "success",
    msg: "",
  });

  /* Filter history by currentHotelId để đồng bộ với logic “mỗi staff 1 khách sạn” */
  const filteredHistory = (accountId: number) =>
    (HISTORY_BY_CUSTOMER[accountId] || []).filter((h) => h.Hotel_ID === currentHotelId);

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" fontWeight={800} sx={{ color: "#b8192b" }}>
          Customers
        </Typography>

        <Stack direction="row" spacing={1}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              label="Trạng thái"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <MenuItem value="ALL">Tất cả</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="banned">Banned</MenuItem>
            </Select>
          </FormControl>

          <TextField
            placeholder="Tìm theo tên / email / SĐT"
            variant="outlined"
            size="small"
            sx={{ width: 280 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Stack>
      </Box>

      {/* Cards grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 2,
        }}
      >
        {data.map((c) => (
          <Box key={c.Account_ID}>
            <Card
              sx={{
                height: "100%",
                boxShadow: "0 4px 6px rgba(0,0,0,0.08)",
                "&:hover": { boxShadow: "0 8px 16px rgba(0,0,0,0.12)", transform: "translateY(-1px)" },
                transition: "all .2s ease",
              }}
            >
              <CardContent>
                {/* Header */}
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Avatar sx={{ bgcolor: "#b8192b" }}>
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        {fullName(c)}
                      </Typography>
                      <Chip
                        size="small"
                        color={statusColorChip(c.Status)}
                        label={capitalize(c.Status)}
                        variant="outlined"
                      />
                    </Box>
                  </Stack>
                  <Tooltip title="Xem chi tiết">
                    <IconButton onClick={() => openDetail(c)}>
                      <MoreVert />
                    </IconButton>
                  </Tooltip>
                </Stack>

                {/* Info */}
                <Stack spacing={0.75} sx={{ mt: 1.5, mb: 1.5 }}>
                  <Row icon={<Email sx={{ fontSize: 16 }} />} text={c.Email} />
                  <Row icon={<Phone sx={{ fontSize: 16 }} />} text={c.PhoneNumber} />
                  {c.Address && <Row icon={<LocationOn sx={{ fontSize: 16 }} />} text={c.Address} />}
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                {/* Stats + Last stay */}
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                  <Chip size="small" label={`Reservations: ${c.TotalReservations}`} />
                  <Chip size="small" label={`Stays: ${c.TotalStays}`} />
                </Stack>
                {c.LastStay ? (
                  <Typography variant="caption" color="text.secondary">
                    Lần gần nhất: {c.LastStay.CheckIn} → {c.LastStay.CheckOut} • Phòng {c.LastStay.RoomNumber} •{" "}
                    {formatVND(c.LastStay.Total)}
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Chưa có lần ở gần đây
                  </Typography>
                )}

                {/* Actions */}
                <Stack direction="row" spacing={1.2} sx={{ mt: 2 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<HistoryIcon />}
                    onClick={() => openDetail(c)}
                  >
                    History
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => openEdit(c)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ backgroundColor: "#b8192b" }}
                    onClick={() => openNewBooking(c)}
                  >
                    New Booking
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        ))}

        {!data.length && (
          <Box sx={{ gridColumn: "1 / -1" }}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Không tìm thấy khách hàng phù hợp.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>

      {/* Dialog: Detail / History (lọc theo currentHotelId) */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Khách hàng {detailCustomer ? fullName(detailCustomer) : ""}</DialogTitle>
        <DialogContent dividers>
          {detailCustomer ? (
            <>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
                <TextField label="Họ" value={detailCustomer.FirstName} InputProps={{ readOnly: true }} fullWidth />
                <TextField label="Tên" value={detailCustomer.LastName} InputProps={{ readOnly: true }} fullWidth />
                <TextField label="Email" value={detailCustomer.Email} InputProps={{ readOnly: true }} fullWidth />
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
                <TextField label="SĐT" value={detailCustomer.PhoneNumber} InputProps={{ readOnly: true }} fullWidth />
                <TextField label="Địa chỉ" value={detailCustomer.Address || ""} InputProps={{ readOnly: true }} fullWidth />
                <TextField label="Trạng thái" value={capitalize(detailCustomer.Status)} InputProps={{ readOnly: true }} fullWidth />
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              <Typography variant="subtitle2" gutterBottom>
                Lịch sử Reservation / Stay (Hotel #{currentHotelId})
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Reservation</TableCell>
                    <TableCell>Stay</TableCell>
                    <TableCell>Phòng / Loại</TableCell>
                    <TableCell>CI → CO</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Giá/đêm</TableCell>
                    <TableCell>Dịch vụ</TableCell>
                    <TableCell align="right">Tổng (ước tính)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredHistory(detailCustomer.Account_ID).map((h) => {
                    const nights = diffNights(h.CheckIn, h.CheckOut);
                    const room = h.NightRate * nights;
                    const svc = h.Services.reduce((s, x) => s + x.UnitPrice * x.Qty, 0);
                    return (
                      <TableRow key={h.Reservation_ID}>
                        <TableCell>#{h.Reservation_ID}</TableCell>
                        <TableCell>{h.Stay_ID ? `#${h.Stay_ID}` : "—"}</TableCell>
                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography variant="body2">{h.RoomNumber ? `Phòng ${h.RoomNumber}` : "—"}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {h.RoomTypeName}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {h.CheckIn} → {h.CheckOut}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip size="small" color={statusColorChipRes(h.Status)} label={capitalize(h.Status)} />
                        </TableCell>
                        <TableCell>{formatVND(h.NightRate)}/đêm</TableCell>
                        <TableCell>
                          {h.Services.length ? (
                            <Stack direction="row" gap={0.5} flexWrap="wrap">
                              {h.Services.map((s, i) => (
                                <Chip key={i} size="small" label={`${s.Name} x${s.Qty}`} variant="outlined" />
                              ))}
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Không
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: "#b8192b" }}>
                          {formatVND(room + svc)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!filteredHistory(detailCustomer.Account_ID).length && (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Typography variant="body2" color="text.secondary">
                          Chưa có lịch sử tại khách sạn hiện tại.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Không có dữ liệu.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Đóng</Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#b8192b" }}
            onClick={() => {
              setDetailOpen(false);
              navigate("/staff/bookings", { state: { customer: detailCustomer?.PhoneNumber } });
            }}
          >
            Mở trang Bookings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Edit customer */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Chỉnh sửa khách hàng</DialogTitle>
        <DialogContent dividers>
          {editForm ? (
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Họ"
                  value={editForm.FirstName}
                  onChange={(e) => setEditForm({ ...editForm, FirstName: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Tên"
                  value={editForm.LastName}
                  onChange={(e) => setEditForm({ ...editForm, LastName: e.target.value })}
                  fullWidth
                />
              </Stack>
              <TextField
                label="Email"
                value={editForm.Email}
                onChange={(e) => setEditForm({ ...editForm, Email: e.target.value })}
                fullWidth
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="SĐT"
                  value={editForm.PhoneNumber}
                  onChange={(e) => setEditForm({ ...editForm, PhoneNumber: e.target.value })}
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    label="Trạng thái"
                    value={editForm.Status}
                    onChange={(e) => setEditForm({ ...editForm, Status: e.target.value as AccountStatus })}
                  >
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="banned">Banned</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <TextField
                label="Địa chỉ"
                value={editForm.Address || ""}
                onChange={(e) => setEditForm({ ...editForm, Address: e.target.value })}
                fullWidth
              />
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Không có dữ liệu.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Hủy</Button>
          <Button variant="contained" sx={{ backgroundColor: "#b8192b" }} onClick={saveEdit}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: New Booking cho khách (walk-in) */}
      <Dialog open={newOpen} onClose={() => setNewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Tạo booking tại quầy</DialogTitle>
        <DialogContent dividers>
          {newForm.customer ? (
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField label="Khách hàng" value={fullName(newForm.customer)} InputProps={{ readOnly: true }} fullWidth />
                <TextField label="SĐT" value={newForm.customer.PhoneNumber} InputProps={{ readOnly: true }} fullWidth />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Loại phòng</InputLabel>
                  <Select
                    label="Loại phòng"
                    value={newForm.roomType}
                    onChange={(e) => {
                      const type = e.target.value as RoomTypeName;
                      setNewForm((f) => ({
                        ...f,
                        roomType: type,
                        roomNumber: AVAILABLE_ROOMS[type].includes(f.roomNumber) ? f.roomNumber : "",
                      }));
                    }}
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
                    value={newForm.roomNumber}
                    onChange={(e) => setNewForm((f) => ({ ...f, roomNumber: e.target.value as string }))}
                  >
                    {AVAILABLE_ROOMS[newForm.roomType].map((r) => (
                      <MenuItem key={r} value={r}>
                        {r}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Đơn giá/đêm"
                  value={formatVND(ROOM_TYPE_PRICE[newForm.roomType])}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Check-in"
                  type="date"
                  value={newForm.checkIn}
                  onChange={(e) => setNewForm((f) => ({ ...f, checkIn: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label="Check-out"
                  type="date"
                  value={newForm.checkOut}
                  onChange={(e) => setNewForm((f) => ({ ...f, checkOut: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label="Số đêm"
                  value={diffNights(newForm.checkIn, newForm.checkOut)}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
              </Stack>

              <Divider />

              <Typography variant="subtitle2">Dịch vụ kèm theo</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
                <FormControl fullWidth>
                  <InputLabel>Dịch vụ</InputLabel>
                  <Select
                    label="Dịch vụ"
                    defaultValue={SERVICE_CATALOG[0].id}
                    onChange={(e) => addServiceToNew(Number(e.target.value), 1)}
                  >
                    {SERVICE_CATALOG.map((x) => (
                      <MenuItem key={x.id} value={x.id}>
                        {x.name} — {formatVND(x.price)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  onClick={() => addServiceToNew(SERVICE_CATALOG[0].id, 1)}
                >
                  Thêm nhanh
                </Button>
              </Stack>

              {newForm.services.length ? (
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
                    {newForm.services.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.name}</TableCell>
                        <TableCell>{formatVND(s.price)}</TableCell>
                        <TableCell sx={{ maxWidth: 100 }}>
                          <TextField
                            size="small"
                            type="number"
                            value={s.qty}
                            onChange={(e) => updateQtyNew(s.id, Number(e.target.value))}
                          />
                        </TableCell>
                        <TableCell>{formatVND(s.price * s.qty)}</TableCell>
                        <TableCell align="right">
                          <Button size="small" color="error" onClick={() => removeSvcNew(s.id)}>
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
                        {formatVND(newForm.services.reduce((s, x) => s + x.price * x.qty, 0))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Chưa có dịch vụ nào.
                </Typography>
              )}

              <Stack direction="row" justifyContent="flex-end">
                <Typography variant="body2" color="text.secondary">
                  Tạm tính: <b>{formatVND(totalNewBooking)}</b>
                </Typography>
              </Stack>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Không có dữ liệu.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewOpen(false)}>Đóng</Button>
          <Button variant="contained" sx={{ backgroundColor: "#b8192b" }} onClick={createNewBooking}>
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

export default StaffCustomers;

/* =========================
   Helpers
   ========================= */
function Row({ icon, text }: { icon: React.ReactNode; text: React.ReactNode }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {icon}
      <Typography variant="body2" color="text.secondary">
        {text}
      </Typography>
    </Stack>
  );
}
function fullName(c: { FirstName: string; LastName: string }) {
  return `${c.FirstName} ${c.LastName}`;
}
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function statusColorChip(s: AccountStatus) {
  if (s === "active") return "success";
  if (s === "inactive") return "default";
  return "error";
}
function statusColorChipRes(s: BookingStatus) {
  if (s === "confirmed") return "success";
  if (s === "pending") return "warning";
  return "error";
}
function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function diffNights(ci: string, co: string) {
  const a = new Date(ci);
  const b = new Date(co);
  const diff = Math.round((+b - +a) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff);
}
