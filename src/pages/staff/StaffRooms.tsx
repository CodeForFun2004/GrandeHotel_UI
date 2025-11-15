import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Button,
  Stack,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  Snackbar,
  Alert,
  Menu,
  CircularProgress,
} from "@mui/material";
import {
  MeetingRoom,
  KingBed,
  People,
  CheckCircle,
  EventBusy,
  DoNotDisturb,
  Build,
  ChevronRight,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";

/* ----------------------------
   Helpers
---------------------------- */
const formatVND = (n: number) =>
  (Number.isFinite(n) ? n : 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

/* ----------------------------
   Types
---------------------------- */
type BackendRoomStatus = 'Reserved' | 'Available' | 'Maintenance' | 'Cleaning' | 'Occupied' | string;
type RoomStatusUI = 'Available' | 'Reserved' | 'Occupied' | 'Under Maintenance';

type ApiRoomType = {
  _id: string;
  name: string;
  capacity?: number;
  amenities?: string[];
};

type ApiHotel = {
  _id: string;
  name?: string;
};

type ApiRoom = {
  _id: string;
  roomType: ApiRoomType;
  hotel?: ApiHotel;
  roomNumber: string;
  status: BackendRoomStatus;
  description?: string;
  pricePerNight: number;
  images?: string[];
};

type RoomCard = {
  id: string;
  number: string;
  name: string;
  price: number;
  status: RoomStatusUI;
  hotelId?: string;
  roomType: { id: string; name: string; capacity?: number };
  image?: string;
  amenities?: string[];
};

/* ----------------------------
   Data helpers
---------------------------- */
const mapBackendStatusToUI = (s: string): RoomStatusUI => {
  switch ((s || '').toLowerCase()) {
    case 'available':
      return 'Available';
    case 'reserved':
      return 'Reserved';
    case 'occupied':
      return 'Occupied';
    case 'maintenance':
    case 'cleaning':
    default:
      return 'Under Maintenance';
  }
};

/* ----------------------------
   UI Config
---------------------------- */
const STATUS_META: Record<
  RoomStatusUI,
  { color: "default" | "success" | "warning" | "error"; label: string; icon: React.ReactNode }
> = {
  "Available": { color: "success", label: "Trống", icon: <CheckCircle fontSize="small" /> },
  "Reserved": { color: "warning", label: "Giữ chỗ", icon: <EventBusy fontSize="small" /> },
  "Occupied": { color: "error", label: "Đang ở", icon: <DoNotDisturb fontSize="small" /> },
  "Under Maintenance": { color: "warning", label: "Bảo trì/Vệ sinh", icon: <Build fontSize="small" /> },
};

const StaffRooms: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Data from backend
  const [rooms, setRooms] = useState<RoomCard[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [roomTypes, setRoomTypes] = useState<{ id: string; name: string }[]>([]);

  /* Filters */
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<RoomStatusUI | "ALL">("ALL");
  const [typeId, setTypeId] = useState<string | "ALL">("ALL");
  const resetFilters = () => {
    setKeyword("");
    setStatus("ALL");
    setTypeId("ALL");
  };

  // If navigated with a specific room filter (from Calendar or other pages), apply it once on mount
  useEffect(() => {
    const state = location.state as { filterRoom?: string } | undefined;
    if (state?.filterRoom) {
      setKeyword(state.filterRoom);
    }
    // We don't want to keep state filter around forever; clear the history state
    // so refreshing or navigating back doesn't reapply unintentionally.
    // This is safe in SPA context.
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    history.replaceState && history.replaceState(null, document.title, location.pathname);
  }, [location.pathname, location.state]);

  // Fetch rooms from backend (public all)
  useEffect(() => {
    const doFetch = async () => {
      try {
        setLoading(true);
        setError(null);
  const res = await api.get('/rooms/all');
        const list: any[] = res.data?.data || res.data || [];
        const mapped: RoomCard[] = list.map((r: any) => {
          const id = r.id ?? r._id ?? '';
          const roomNumber = r.roomNumber ?? r.code ?? '';
          const rt = r.roomType || {};
          return {
            id,
            number: String(roomNumber),
            name: `${rt?.name ?? r.name ?? 'Room'} ${roomNumber}`.trim(),
            price: Number(r.pricePerNight ?? rt?.basePrice ?? 0),
            status: mapBackendStatusToUI(r.status),
            hotelId: r.hotel?._id ?? r.hotel?.id,
            roomType: { id: rt?._id || rt?.id || '', name: rt?.name || 'Unknown', capacity: rt?.capacity },
            image: (Array.isArray(r.images) && r.images.length > 0) ? r.images[0] : undefined,
            amenities: Array.isArray(rt?.amenities) ? rt.amenities : [],
          } as RoomCard;
        });
        setRooms(mapped);
        const uniqueTypes = new Map<string, string>();
        mapped.forEach((m) => { if (m.roomType.id) uniqueTypes.set(m.roomType.id, m.roomType.name); });
        setRoomTypes(Array.from(uniqueTypes.entries()).map(([id, name]) => ({ id, name })));
      } catch (e: any) {
        console.error('Fetch rooms failed:', e);
        setError(e?.response?.data?.message || e?.message || 'Failed to load rooms');
      } finally {
        setLoading(false);
      }
    };
    doFetch();
  }, []);

  // Snackbar
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "info" | "warning" | "error" }>({
    open: false,
    msg: "",
    severity: "success",
  });

  // Assign / Reserve dialog
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignRoom, setAssignRoom] = useState<RoomCard | null>(null);
  const [assignMode, setAssignMode] = useState<"reserve" | "checkin">("reserve");
  const [guestName, setGuestName] = useState("");
  const [ci, setCi] = useState("");
  const [co, setCo] = useState("");
  const [sellPrice, setSellPrice] = useState<number>(0);

  // Action dialogs for Reserved / Occupied
  const [reservedDlg, setReservedDlg] = useState<RoomCard | null>(null);
  const [occupiedDlg, setOccupiedDlg] = useState<RoomCard | null>(null);

  // Maintenance menu
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuRoom, setMenuRoom] = useState<RoomCard | null>(null);

  // filter for UI
  const data = useMemo(() => {
    return rooms.filter((room) => {
      const kw = keyword.trim().toLowerCase();
      const matchKw =
        !kw ||
        room.number.toLowerCase().includes(kw) ||
        room.name.toLowerCase().includes(kw) ||
        room.roomType.name.toLowerCase().includes(kw);
      const matchStatus = status === "ALL" || room.status === status;
      const matchType = typeId === "ALL" || room.roomType.id === typeId;
      return matchKw && matchStatus && matchType;
    });
  }, [keyword, status, typeId, rooms]);

  const updateRoomStatus = (id: string, s: RoomStatusUI) => {
    setRooms((arr) => arr.map((r) => (r.id === id ? { ...r, status: s } : r)));
  };

  const openAssignDialog = (r: RoomCard) => {
    setAssignRoom(r);
    setAssignMode("reserve");
    setGuestName("");
    setCi("");
    setCo("");
    setSellPrice(r.price);
    setAssignOpen(true);
  };

  const confirmAssign = () => {
    if (!assignRoom) return;
    // UI only: cập nhật trạng thái
  updateRoomStatus(assignRoom.id, assignMode === "reserve" ? "Reserved" : "Occupied");
    setAssignOpen(false);
    setSnack({
      open: true,
      msg:
        assignMode === "reserve"
          ? `Đã giữ chỗ phòng ${assignRoom.number} cho ${guestName || "khách"}`
          : `Đã check-in phòng ${assignRoom.number} cho ${guestName || "khách"}`,
      severity: "success",
    });
  };

  const onReservedAction = (r: RoomCard) => setReservedDlg(r);
  const onOccupiedAction = (r: RoomCard) => setOccupiedDlg(r);

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5" fontWeight={800} sx={{ color: "#b8192b" }}>
          Rooms
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" color="inherit" startIcon={<Build />} disabled>
            Bulk Actions
          </Button>
          <Button variant="contained" sx={{ backgroundColor: "#b8192b" }} disabled>
            Add Room
          </Button>
        </Stack>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
            <TextField
              label="Tìm theo số phòng / tên / hạng"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              fullWidth
            />
            <Button variant="text" color="inherit" onClick={resetFilters}>
              Xóa bộ lọc
            </Button>

            <ToggleButtonGroup
              exclusive
              value={status}
              onChange={(_, v) => v && setStatus(v)}
              size="small"
            >
              <ToggleButton value="ALL">Tất cả</ToggleButton>
              {(
                [
                  "Available",
                  "Reserved",
                  "Occupied",
                  "Under Maintenance",
                ] as RoomStatusUI[]
              ).map((s) => (
                <ToggleButton key={s} value={s}>
                  {STATUS_META[s].label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Loại phòng</InputLabel>
              <Select
                label="Loại phòng"
                value={typeId}
                onChange={(e) =>
                  setTypeId((e.target.value as string) || "ALL")
                }
              >
                <MenuItem value={"ALL" as any}>Tất cả</MenuItem>
                {roomTypes.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Divider sx={{ my: 1.5 }} />

              {/* Legend + Debug */}
              <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
            {(Object.keys(STATUS_META) as RoomStatusUI[]).map((k) => (
              <Chip
                key={k}
                size="small"
                icon={STATUS_META[k].icon as any}
                color={STATUS_META[k].color}
                label={STATUS_META[k].label}
                variant="outlined"
              />
            ))}
                <Box sx={{ flex: 1 }} />
                {/* Lightweight debug info to help diagnose empty results */}
                <Chip size="small" label={`Tổng: ${rooms.length}`} />
                <Chip size="small" label={`Hiển thị: ${data.length}`} />
                {(keyword || status !== 'ALL' || typeId !== 'ALL') && (
                  <Chip size="small" color="info" label="Đang lọc" />
                )}
          </Stack>
        </CardContent>
      </Card>

      {/* Loading / Error states */}
      {loading && (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Đang tải danh sách phòng...
          </Typography>
        </Stack>
      )}
      {!!error && !loading && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Empty state */}
      {!loading && !error && data.length === 0 && (
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          <Alert severity="info">
            Không có phòng nào phù hợp với bộ lọc hiện tại.
          </Alert>
          {(keyword || status !== 'ALL' || typeId !== 'ALL') && (
            <Button variant="outlined" color="inherit" onClick={resetFilters} sx={{ alignSelf: 'start' }}>
              Xóa tất cả bộ lọc
            </Button>
          )}
        </Stack>
      )}

      {/* Grid */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
        }}
      >
  {data.map((room) => {
    const firstImg = room.image;
    const meta = STATUS_META[room.status];

          return (
            <Card
              key={room.id}
              sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                overflow: "hidden",
                boxShadow: "0 4px 6px rgba(0,0,0,0.08)",
                "&:hover": { boxShadow: "0 8px 16px rgba(0,0,0,0.12)", transform: "translateY(-1px)" },
                transition: "all .2s ease",
              }}
            >
              {firstImg && (
                <CardMedia
                  component="img"
                  height="148"
                  image={firstImg}
                  alt={room.name}
                  sx={{ objectFit: "cover" }}
                />
              )}

              <CardContent sx={{ flex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                  <MeetingRoom sx={{ color: "#b8192b" }} />
                  <Typography variant="h6" fontWeight={700}>
                    Phòng {room.number}
                  </Typography>
                  <Box sx={{ flex: 1 }} />
                  <Chip
                    size="small"
                    color={meta.color}
                    icon={meta.icon as any}
                    label={meta.label}
                    variant="outlined"
                  />
                </Stack>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {room.roomType.name}
                </Typography>

                <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <KingBed fontSize="small" />
                    <Typography variant="body2">{Math.max(1, Math.ceil((room.roomType.capacity ?? 2) / 2))} giường</Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <People fontSize="small" />
                    <Typography variant="body2">{room.roomType.capacity ?? 2} người</Typography>
                  </Stack>
                </Stack>

                <Typography variant="h6" sx={{ color: "#b8192b", mb: 1 }}>
                  {formatVND(room.price)}/đêm
                </Typography>

                {/* Facilities (top 3 + more) */}
                <Stack direction="row" gap={0.75} flexWrap="wrap">
                  {(room.amenities || []).slice(0, 3).map((a, idx) => (
                    <Chip key={`${room.id}-amenity-${idx}`} size="small" label={a} variant="outlined" />
                  ))}
                </Stack>
              </CardContent>

              {/* Actions */}
              <Box sx={{ px: 2, pb: 2, pt: 0 }}>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    endIcon={<ChevronRight />}
                    fullWidth
                    onClick={() => {
                      if (location.pathname.startsWith('/staff')) {
                        navigate(`/staff/rooms/${room.id}`);
                      }
                    }}
                    disabled={!location.pathname.startsWith('/staff')}
                  >
                    Chi tiết
                  </Button>

                  {room.status === "Available" ? (
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      fullWidth
                      onClick={() => openAssignDialog(room)}
                    >
                      Đặt / Gán
                    </Button>
                  ) : room.status === "Reserved" ? (
                    <Tooltip title="Khách đã giữ chỗ — có thể nhận phòng khi tới">
                      <span style={{ width: "100%" }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="warning"
                          fullWidth
                          onClick={() => onReservedAction(room)}
                        >
                          Chờ check-in
                        </Button>
                      </span>
                    </Tooltip>
                  ) : room.status === "Occupied" ? (
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      fullWidth
                      onClick={() => onOccupiedAction(room)}
                    >
                      Đang lưu trú
                    </Button>
                  ) : (
                    <Tooltip title="Không khả dụng">
                      <span style={{ width: "100%" }}>
                        <Button size="small" variant="outlined" color="inherit" fullWidth disabled>
                          Không khả dụng
                        </Button>
                      </span>
                    </Tooltip>
                  )}

                  <IconButton
                    size="small"
                    onClick={(e) => {
                      setMenuAnchor(e.currentTarget);
                      setMenuRoom(room);
                    }}
                  >
                    <Build fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>
            </Card>
          );
        })}
      </Box>

      {/* Dialog: Assign / Reserve */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Đặt / Gán phòng {assignRoom?.number}</DialogTitle>
        <DialogContent dividers>
          <RadioGroup
            row
            value={assignMode}
            onChange={(e) => setAssignMode(e.target.value as "reserve" | "checkin")}
            sx={{ mb: 2 }}
          >
            <FormControlLabel value="reserve" control={<Radio />} label="Đặt (Giữ chỗ)" />
            <FormControlLabel value="checkin" control={<Radio />} label="Gán ngay (Check-in)" />
          </RadioGroup>

          <Stack spacing={1.5}>
            <TextField
              label="Tên khách"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              fullWidth
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                label="Check-in"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={ci}
                onChange={(e) => setCi(e.target.value)}
                fullWidth
              />
              <TextField
                label="Check-out"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={co}
                onChange={(e) => setCo(e.target.value)}
                fullWidth
              />
            </Stack>
            <TextField
              label="Giá bán (VND/đêm)"
              type="number"
              value={sellPrice}
              onChange={(e) => setSellPrice(Number(e.target.value))}
              fullWidth
            />
            <Alert severity="info">
              UI demo — thao tác này chỉ cập nhật trạng thái trong bộ nhớ tạm.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={confirmAssign}>
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: room Reserved actions */}
      <Dialog open={!!reservedDlg} onClose={() => setReservedDlg(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Phòng {reservedDlg?.number} đang giữ chỗ</DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Bạn muốn làm gì tiếp theo?
          </Alert>
          <Stack spacing={1}>
            <Button
              variant="contained"
              onClick={() => {
                setReservedDlg(null);
                navigate(`/staff/check-in?room=${reservedDlg?.number}`);
              }}
            >
              Đi tới Check-in
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => {
                if (reservedDlg) updateRoomStatus(reservedDlg.id, "Available");
                setReservedDlg(null);
                setSnack({ open: true, msg: "Đã hủy giữ chỗ (trả phòng về Trống).", severity: "success" });
              }}
            >
              Hủy giữ chỗ (Trả về Trống)
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReservedDlg(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: room Occupied actions */}
      <Dialog open={!!occupiedDlg} onClose={() => setOccupiedDlg(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Phòng {occupiedDlg?.number} đang lưu trú</DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Chọn thao tác:
          </Alert>
          <Stack spacing={1}>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                setOccupiedDlg(null);
                navigate(`/staff/check-out?room=${occupiedDlg?.number}`);
              }}
            >
              Đi tới Check-out
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => {
                if (occupiedDlg) updateRoomStatus(occupiedDlg.id, "Available");
                setOccupiedDlg(null);
                setSnack({ open: true, msg: "Đã đổi trạng thái về Trống (mock).", severity: "success" });
              }}
            >
              Kết thúc nhanh (đổi về Trống)
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOccupiedDlg(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Maintenance menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => {
          setMenuAnchor(null);
          setMenuRoom(null);
        }}
      >
        <MenuItem
          onClick={() => {
            if (menuRoom) updateRoomStatus(menuRoom.id, "Under Maintenance");
            setMenuAnchor(null);
            setMenuRoom(null);
            setSnack({ open: true, msg: "Đã đánh dấu Bảo trì.", severity: "info" });
          }}
        >
          Bảo trì
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuRoom) updateRoomStatus(menuRoom.id, "Under Maintenance");
            setMenuAnchor(null);
            setMenuRoom(null);
            setSnack({ open: true, msg: "Đã đánh dấu bảo trì.", severity: "warning" });
          }}
        >
          Out of Order
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuRoom) updateRoomStatus(menuRoom.id, "Available");
            setMenuAnchor(null);
            setMenuRoom(null);
            setSnack({ open: true, msg: "Đã đổi về Trống.", severity: "success" });
          }}
        >
          Trả về Trống
        </MenuItem>
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} sx={{ width: "100%" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StaffRooms;
