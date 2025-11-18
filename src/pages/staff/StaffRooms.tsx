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
  MenuItem,
  Pagination,
  Fab,
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
  KeyboardArrowUp,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { getReservationForCheckIn as apiGetReservationForCheckIn } from "../../api/dashboard";

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
type RoomStatusUI = 'Available' | 'Reserved' | 'Occupied' | 'Under Maintenance';

type RoomCard = {
  id: string;
  number: string;
  code?: string;
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
  string,
  { color: "default" | "primary" | "secondary" | "success" | "warning" | "error" | "info"; label: string; icon: React.ReactNode }
> = {
  "ALL": { color: "primary", label: "Tất cả", icon: <CheckCircle fontSize="small" /> },
  "Available": { color: "success", label: "Trống", icon: <CheckCircle fontSize="small" /> },
  "Reserved": { color: "warning", label: "Giữ chỗ", icon: <EventBusy fontSize="small" /> },
  "Occupied": { color: "error", label: "Đang ở", icon: <DoNotDisturb fontSize="small" /> },
  // Use secondary (purple) for maintenance/cleaning to get a violet tone
  "Under Maintenance": { color: "secondary", label: "Bảo trì", icon: <Build fontSize="small" /> },
};

const StaffRooms: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Data from backend
  const [rooms, setRooms] = useState<RoomCard[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  

  /* Filters */
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<RoomStatusUI | "ALL">("ALL");
  const resetFilters = () => {
    setKeyword("");
    setStatus("ALL");
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

  // Pagination state (declare before effects that use `page`)
  const itemsPerPage = 15;
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Fetch rooms from backend (use hotel-scoped endpoints when running under /staff or /manager)
  useEffect(() => {
    const doFetch = async () => {
      try {
        setLoading(true);
        setError(null);
        // Prefer hotel-scoped endpoints and pass pagination + filters
        // - staff UI should call GET /api/rooms/staff (requires auth)
        // - manager UI should call GET /api/rooms (requires manager auth)
        // Fallback to GET /api/rooms/all which returns all rooms (admin view)
        let endpoint = '/rooms/all';
        try {
          if (location.pathname.startsWith('/staff')) endpoint = '/rooms/staff';
          else if (location.pathname.startsWith('/manager')) endpoint = '/rooms';
        } catch (e) {
          endpoint = '/rooms/all';
        }

        const params: any = { page, limit: itemsPerPage };
        if (keyword) params.search = keyword;
        if (status && status !== 'ALL') params.status = status;

        const res = await api.get(endpoint, { params });
        // server returns { data, pagination } or array
        const list: any[] = res.data?.data || res.data || [];
        const pagination = res.data?.pagination;
        if (pagination) {
          setTotalPages(pagination.totalPages || Math.max(1, Math.ceil((pagination.total || 0) / itemsPerPage)));
          setTotalCount(pagination.total || 0);
        } else {
          setTotalPages(Math.max(1, Math.ceil(list.length / itemsPerPage)));
          setTotalCount(list.length);
        }

        const mapped: RoomCard[] = list.map((r: any) => {
          const id = r.id ?? r._id ?? '';
          const roomNumber = r.roomNumber ?? r.number ?? '';
          const code = r.code ?? r.roomCode ?? '';
          const rt = r.roomType || {};
          const rawStatus = r.status ?? r.state ?? r.roomStatus ?? (Array.isArray(r.reservations) && r.reservations.length ? 'reserved' : undefined);
          return {
            id,
            number: String(roomNumber),
            code: code ? String(code) : undefined,
            name: `${rt?.name ?? r.name ?? 'Room'} ${code || roomNumber}`.trim(),
            price: Number(r.pricePerNight ?? rt?.basePrice ?? 0),
            status: mapBackendStatusToUI(rawStatus),
            hotelId: r.hotel?._id ?? r.hotel?.id,
            roomType: { id: rt?._id || rt?.id || '', name: rt?.name || 'Unknown', capacity: rt?.capacity },
            image: (Array.isArray(r.images) && r.images.length > 0) ? r.images[0] : undefined,
            amenities: Array.isArray(rt?.amenities) ? rt.amenities : [],
          } as RoomCard;
        });
        setRooms(mapped);
      } catch (e: any) {
        console.error('Fetch rooms failed:', e);
        setError(e?.response?.data?.message || e?.message || 'Failed to load rooms');
      } finally {
        setLoading(false);
      }
    };
    doFetch();
  }, [location.pathname, page, keyword, status]);

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
      return matchKw && matchStatus;
    });
  }, [keyword, status, rooms]);

  // Pagination
  useEffect(() => {
    // Reset to first page when filters change
    setPage(1);
  }, [keyword, status]);

  // displayed uses server-provided page in `rooms`
  const displayed = data;

  // Return-to-top FAB
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowTop((window.scrollY || window.pageYOffset) > 240);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

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
    // If a manager is using this page, block assign/check-in actions and show message
    if (location.pathname.startsWith('/manager')) {
      setAssignOpen(false);
      setSnack({ open: true, msg: 'Chỉ nhân viên lễ tân mới có thể thực hiện đặt/gán phòng trên trang Check-in. Vui lòng dùng tài khoản Staff hoặc truy cập trang Bookings của Manager.', severity: 'warning' });
      return;
    }

    // UI only: cập nhật trạng thái (mock)
    updateRoomStatus(assignRoom.id, assignMode === "reserve" ? "Reserved" : "Occupied");
    setAssignOpen(false);
    setSnack({ open: true, msg: assignMode === "reserve" ? `Đã giữ chỗ phòng ${assignRoom.number} cho ${guestName || "khách"}` : `Đã check-in phòng ${assignRoom.number} cho ${guestName || "khách"}`, severity: "success" });
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
          <Button variant="outlined" color="inherit" startIcon={<Build />} disabled={!location.pathname.startsWith('/manager')}>
            Thao tác hàng loạt
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#b8192b" }}
            disabled={!location.pathname.startsWith('/manager')}
            onClick={() => navigate('/manager/rooms/create')}
          >
            Thêm phòng
          </Button>
        </Stack>
      </Box>

      {/* (pagination moved below the grid to keep header compact) */}

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
          </Stack>

          <Divider sx={{ my: 1.5 }} />

              {/* Legend + Debug */}
              <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
            {(
              ["ALL", "Available", "Reserved", "Occupied", "Under Maintenance"]
            ).map((k) => {
              const meta = (STATUS_META as any)[k];
              const isSelected = k === 'ALL' ? status === 'ALL' : status === k;
              const handleClick = () => {
                if (k === 'ALL') setStatus('ALL');
                else setStatus(isSelected ? 'ALL' : (k as RoomStatusUI));
              };
              const handleKey = (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClick();
                }
              };
              return (
                <Chip
                  key={k}
                  size="small"
                  icon={meta.icon as any}
                  label={meta.label}
                  clickable
                  tabIndex={0}
                  onKeyDown={handleKey}
                  onClick={handleClick}
                  color={meta.color as any}
                  variant={isSelected ? undefined : 'outlined'}
                  sx={{ cursor: 'pointer', ...(k === 'ALL' ? { ml: 0 } : {}) }}
                />
              );
            })}
                <Box sx={{ flex: 1 }} />
                {/* Lightweight debug info to help diagnose empty results */}
                <Chip size="small" label={`Tổng: ${totalCount || rooms.length}`} />
                <Chip size="small" label={`Hiển thị: ${data.length}`} />
                {(keyword || status !== 'ALL') && (
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
          {(keyword || status !== 'ALL') && (
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
  {displayed.map((room) => {
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
                    Phòng {room.code ?? room.number}
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
                        } else if (location.pathname.startsWith('/manager')) {
                          navigate(`/manager/rooms/${room.id}`);
                        }
                      }}
                    disabled={!(location.pathname.startsWith('/staff') || location.pathname.startsWith('/manager'))}
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

      {/* Pagination (placed after grid so it appears near page bottom) */}
      {totalPages > 1 && (
        <Stack alignItems="center" sx={{ mt: 2, mb: 2 }}>
          <Pagination page={page} count={totalPages} onChange={(_e, p) => setPage(p)} color="primary" />
        </Stack>
      )}

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
              onClick={async () => {
                try {
                  if (!reservedDlg) return;
                  // If a manager clicked this, show a helpful message and redirect to manager bookings
                  if (location.pathname.startsWith('/manager')) {
                    // For managers, show a clear snackbar only and do not redirect.
                    setReservedDlg(null);
                    setSnack({ open: true, msg: 'Chỉ nhân viên lễ tân mới được mở trang Check-in. Vui lòng dùng tài khoản Staff để thao tác check-in.', severity: 'warning' });
                    return;
                  }
                  setReservedDlg(null);
                  // Try to resolve the reservation that reserved this room by fetching room details
                  try {
                    const r = await api.get(`/rooms/public/${reservedDlg.id}`);
                    const payload = r.data?.data || r.data || {};
                    const bookings = Array.isArray(payload.bookings) ? payload.bookings : [];
                    // Prefer reservations that have check-in today AND are ready for check-in
                    if (bookings.length > 0) {
                      const todayStart = new Date();
                      todayStart.setHours(0,0,0,0);
                      const todayEnd = new Date();
                      todayEnd.setHours(23,59,59,999);

                      const todays = bookings.filter((b:any) => {
                        try {
                          const d = new Date(b.checkInDate);
                          return d >= todayStart && d <= todayEnd;
                        } catch(e) { return false; }
                      }).sort((a:any,b:any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                      for (const cand of todays) {
                        const resId = cand._id || cand.id || cand.reservation;
                        if (!resId) continue;
                        try {
                          // Verify reservation is ready for check-in via backend endpoint
                          await apiGetReservationForCheckIn(String(resId));
                          // success -> navigate directly to reservation check-in
                          navigate(`/staff/checkin?reservation=${resId}`);
                          return;
                        } catch (e) {
                          // reservation not ready (400) or other error -> continue to next candidate
                          continue;
                        }
                      }
                    }
                  } catch (e) {
                    // ignore and fallback to room-based nav
                    console.warn('Room bookings resolution failed, falling back to room search', e);
                  }
                  // If we reach here: no ready today's reservation found — show message and open room-scoped list
                  setSnack({ open: true, msg: 'Không tìm thấy đặt phòng hôm nay sẵn sàng để check-in. Hiển thị danh sách đặt phòng chứa phòng này để lựa chọn.', severity: 'info' });
                  navigate(`/staff/checkin?room=${reservedDlg?.number}`);
                } catch (err) {
                  console.error('Failed to open check-in for reserved room', err);
                  setReservedDlg(null);
                }
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
                navigate(`/staff/checkout?room=${occupiedDlg?.number}`);
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

      {/* Return to top FAB (avoid overlapping chat: offset from bottom) */}
      {showTop && (
        <Fab
          size="small"
          color="primary"
          aria-label="scroll to top"
          onClick={scrollToTop}
          sx={{ position: 'fixed', bottom: { xs: 88, sm: 88 }, right: 16, zIndex: 1400 }}
        >
          <KeyboardArrowUp />
        </Fab>
      )}
    </Box>
  );
};

export default StaffRooms;
