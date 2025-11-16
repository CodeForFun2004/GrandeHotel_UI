import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Typography,
  Breadcrumbs,
  Link as MUILink,
  Chip,
  Stack,
  Card,
  CardContent,
  CardMedia,
  Button,
  Divider,
  IconButton,
  Snackbar,
  Tabs,
  Tab,
  ImageList,
  ImageListItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  CircularProgress,
  Alert,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import {
  MeetingRoom,
  KingBed,
  People,
  CheckCircle,
  EventBusy,
  DoNotDisturb,
  Build,
  ReportProblem,
  Edit,
  Add,
  DeleteOutline,
  ArrowBack,
  UploadFile,
} from "@mui/icons-material";
import api from "../../api/axios";
import { io as ioClient } from 'socket.io-client';
import MiniBookingCalendar from '../../components/MiniBookingCalendar';

// small helpers for calendar
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/* =========================
   Helpers & Types
========================= */
const formatVND = (n: number) =>
  (Number.isFinite(n) ? n : 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

type RoomStatus =
  | "Available"
  | "Reserved"
  | "Occupied"
  | "Under Maintenance"
  | "Closed"
  | "Out of Order";

type RoomType = {
  RoomType_ID: number;
  Name: string;
  Number_of_Bed: number;
  Capacity: number;
  Base_price: number;
  Description?: string;
};

type Room = {
  Room_ID: number;
  RoomType_ID: number;
  Number: string;
  Name: string;
  Description?: string;
  Price: number;
  Status: RoomStatus;
  Hotel_ID: number;
};

type RoomFacility = {
  Room_Facility_ID: number;
  Room_ID: number;
  FacilityType_ID: number;
  Name: string; // denormalized for UI
  Description?: string;
  Status: RoomStatus;
};

type RoomImage = { Room_Image_ID: number; URL: string; Room_ID: number };

const STATUS_META: Record<
  RoomStatus,
  { color: "default" | "success" | "warning" | "error"; label: string; icon: React.ReactNode }
> = {
  Available: { color: "success", label: "Trống", icon: <CheckCircle fontSize="small" /> },
  Reserved: { color: "warning", label: "Giữ chỗ", icon: <EventBusy fontSize="small" /> },
  Occupied: { color: "error", label: "Đang ở", icon: <DoNotDisturb fontSize="small" /> },
  "Under Maintenance": { color: "warning", label: "Bảo trì", icon: <Build fontSize="small" /> },
  Closed: { color: "default", label: "Đóng", icon: <DoNotDisturb fontSize="small" /> },
  "Out of Order": { color: "default", label: "Hỏng (OOO)", icon: <ReportProblem fontSize="small" /> },
};

/* =========================
   Live data from backend
   (replaces former mock arrays)
========================= */
const EMPTY_ROOM_TYPE: RoomType = { RoomType_ID: 0, Name: "Unknown", Number_of_Bed: 1, Capacity: 2, Base_price: 0 };

/* =========================
   Component
========================= */
export default function StaffRoomDetail() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  // fetch live data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // default to Activity tab
  const [tab, setTab] = useState(3);
  const [openStatusDlg, setOpenStatusDlg] = useState(false);

  // snackbar for status-change feedback + undo
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState<string | null>(null);
  const [prevStatus, setPrevStatus] = useState<RoomStatus | null>(null);

  const [room, setRoom] = useState<Room | null>(null);
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [imgList, setImgList] = useState<RoomImage[]>([]);
  const [facList, setFacList] = useState<RoomFacility[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  const [openFacDlg, setOpenFacDlg] = useState(false);
  const [facToAdd, setFacToAdd] = useState<string>("");
  const [openImgDlg, setOpenImgDlg] = useState(false);
  const [newImgUrl, setNewImgUrl] = useState("");

  // status follows loaded room
  const [status, setStatus] = useState<RoomStatus>("Available");
  useEffect(() => {
    if (room) setStatus(room.Status ?? "Available");
  }, [room]);

  const roomPack = useMemo(() => {
    const r: Room =
      room ?? ({ Room_ID: Number(roomId ?? 1), RoomType_ID: roomType?.RoomType_ID ?? 0, Number: String(roomId ?? ""), Name: "", Description: "", Price: 0, Status: "Available", Hotel_ID: 0 } as Room);
    const t: RoomType = roomType ?? EMPTY_ROOM_TYPE;
    return { room: r, type: t, images: imgList, facilities: facList };
  }, [room, roomType, imgList, facList, roomId]);

  useEffect(() => {
    const doFetch = async () => {
      if (!roomId) return;
      try {
        setLoading(true);
        setError(null);
        // Use the public endpoint to avoid role-based 403 for staff/manager UI
        const res = await api.get(`/rooms/public/${roomId}`);
        const payload = res.data?.data || res.data || {};

        // Map backend fields into our UI types (best-effort)
        const mappedRoom: Room = {
          Room_ID: Number(payload._id ?? payload.id ?? roomId),
          RoomType_ID: Number(payload.roomType?._id ?? payload.roomType?.id ?? payload.roomType ?? 0),
          Number: String(payload.roomNumber ?? payload.number ?? payload.code ?? payload.name ?? roomId),
          Name: payload.name ?? payload.title ?? `Room ${payload.roomNumber ?? roomId}`,
          Description: payload.description ?? payload.note,
          Price: Number(payload.pricePerNight ?? payload.price ?? payload.roomType?.basePrice ?? 0),
          Status: (payload.status as RoomStatus) ?? (payload.state as RoomStatus) ?? "Available",
          Hotel_ID: Number(payload.hotel?._id ?? payload.hotel?.id ?? payload.hotelId ?? 0),
        };

        const rt = payload.roomType || {};
        const mappedType: RoomType = {
          RoomType_ID: Number(rt._id ?? rt.id ?? mappedRoom.RoomType_ID ?? 0),
          Name: rt.name ?? rt.title ?? (rt.typeName || "Unknown"),
          Number_of_Bed: Number(rt.numberOfBed ?? rt.beds ?? 1),
          Capacity: Number(rt.capacity ?? 2),
          Base_price: Number(rt.basePrice ?? rt.base_price ?? rt.price ?? 0),
        };

        const images: RoomImage[] = Array.isArray(payload.images)
          ? payload.images.map((u: any, i: number) => ({ Room_Image_ID: i + 1, URL: u, Room_ID: mappedRoom.Room_ID }))
          : Array.isArray(payload.imagesInfo)
          ? payload.imagesInfo.map((it: any, i: number) => ({ Room_Image_ID: i + 1, URL: it.url ?? it.URL, Room_ID: mappedRoom.Room_ID }))
          : [];

        const facilities: RoomFacility[] = Array.isArray(payload.amenities)
          ? payload.amenities.map((a: any, i: number) => ({ Room_Facility_ID: i + 1, Room_ID: mappedRoom.Room_ID, FacilityType_ID: i + 1, Name: a, Status: "Available" }))
          : [];

        const acts = Array.isArray(payload.activities) ? payload.activities : Array.isArray(payload.history) ? payload.history : [];
        const bks = Array.isArray(payload.bookings)
          ? payload.bookings
          : Array.isArray(payload.reservations)
          ? payload.reservations
          : [];

        // Normalize bookings so the calendar can reliably pick dates regardless of field names or nesting
        const normalizeBooking = (raw: any) => {
          if (!raw) return null;
          const b: any = { ...raw };
          // prefer top-level canonical fields
          b.checkInDate = b.checkInDate ?? b.checkIn ?? b.start ?? b.from ?? b.arrival ?? b.check_in_date ?? null;
          b.checkOutDate = b.checkOutDate ?? b.checkOut ?? b.end ?? b.to ?? b.departure ?? b.check_out_date ?? null;
          // some responses put reservation inside a `reservation` key
          if ((!b.checkInDate || !b.checkOutDate) && b.reservation) {
            b.checkInDate = b.checkInDate ?? b.reservation.checkInDate ?? b.reservation.checkIn ?? b.reservation.start ?? b.checkInDate;
            b.checkOutDate = b.checkOutDate ?? b.reservation.checkOutDate ?? b.reservation.checkOut ?? b.reservation.end ?? b.checkOutDate;
          }
          // ensure dates are strings or numbers (MiniBookingCalendar will handle Mongo $date shapes)
          return b;
        };

        const normalizedBookings = bks.map(normalizeBooking).filter(Boolean);

        setRoom(mappedRoom);
        console.log('Room (after fetch):', mappedRoom);
        setRoomType(mappedType);
        setImgList(images);
        setFacList(facilities);
        // initial activities from payload (if any)
        setActivities(acts);
        setBookings(normalizedBookings);
        console.log('room payload bookings (after fetch):', normalizedBookings);

        // fetch latest activities from dedicated endpoint (paginated)
        try {
          const aRes = await api.get(`/rooms/${roomId}/activities?limit=20`);
          if (aRes?.data?.data) setActivities(aRes.data.data);
        } catch (e) {
          // ignore; keep any activities coming from payload
        }
      } catch (e: any) {
        console.error('Fetch room failed', e);
        setError(e?.response?.data?.message || e?.message || 'Failed to load room');
      } finally {
        setLoading(false);
      }
    };
    doFetch();
  }, [roomId]);

  // real-time: subscribe to room activity events via socket
  useEffect(() => {
    if (!roomId) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = ioClient('http://localhost:1000', { auth: { token } });

    const handler = (payload: any) => {
      try {
        if (!payload) return;
        const r = payload.room || (payload.activity && payload.activity.room);
        if (!r) return;
        if (r.toString() === roomId.toString()) {
          // prepend newest
          const act = payload.activity || payload;
          setActivities((arr) => [act, ...arr]);
        }
      } catch (err) {
        // ignore
      }
    };

    socket.on('room_activity', handler);

    return () => {
      socket.off('room_activity', handler);
      socket.disconnect();
    };
  }, [roomId]);

  const meta = STATUS_META[status];
  const cover = imgList[0]?.URL;

  const showStatusSnackbar = (message: string, previous: RoomStatus | null) => {
    setSnackbarMsg(message);
    setPrevStatus(previous);
    setSnackbarOpen(true);
  };

  const handleChangeStatus = async (newStatus: RoomStatus) => {
    if (!room) return;
    const old = status;
    try {
      // optimistic UI update
      setStatus(newStatus);
      await api.put(`/rooms/${room.Room_ID}`, { status: newStatus });
      showStatusSnackbar(`Trạng thái đã đổi thành “${STATUS_META[newStatus].label}”`, old);
    } catch (e) {
      console.error('Failed to update room status', e);
      // revert on error
      setStatus(old);
      showStatusSnackbar('Không thể thay đổi trạng thái (lỗi).', old);
    }
  };

  const handleUndoStatus = async () => {
    if (!room || prevStatus == null) return;
    try {
      await api.put(`/rooms/${room.Room_ID}`, { status: prevStatus });
      setStatus(prevStatus);
      setSnackbarOpen(false);
    } catch (e) {
      console.error('Failed to undo status', e);
    }
  };

  const addFacility = () => {
    const name = facToAdd?.trim();
    if (!name) return setOpenFacDlg(false);
    setFacList((arr) => [
      ...arr,
      {
        Room_Facility_ID: Date.now(),
        Room_ID: roomPack.room.Room_ID,
        FacilityType_ID: Date.now() % 100000,
        Name: name,
        Status: "Available",
      },
    ]);
    setFacToAdd("");
    setOpenFacDlg(false);
  };

  const removeFacility = (id: number) =>
    setFacList((arr) => arr.filter((x) => x.Room_Facility_ID !== id));

  const addImage = () => {
    if (!newImgUrl.trim()) return;
    setImgList((arr) => [
      ...arr,
      { Room_Image_ID: Date.now(), Room_ID: roomPack.room.Room_ID, URL: newImgUrl.trim() },
    ]);
    setNewImgUrl("");
    setOpenImgDlg(false);
  };

  const removeImage = (id: number) =>
    setImgList((arr) => arr.filter((x) => x.Room_Image_ID !== id));

  return (
    <Box>
      {/* Breadcrumb + back */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBack />
        </IconButton>
        <Breadcrumbs>
          <MUILink component={RouterLink} to="/staff/rooms" underline="hover" color="inherit">
            Rooms
          </MUILink>
          <Typography color="text.primary">Phòng {roomPack.room.Number}</Typography>
        </Breadcrumbs>
      </Stack>

      {/* Loading / Error */}
      {loading && (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 1 }}>Đang tải thông tin phòng...</Typography>
        </Stack>
      )}
      {!!error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {/* Header card */}
      <Card sx={{ mb: 2, overflow: "hidden", boxShadow: "0 4px 8px rgba(0,0,0,0.06)" }}>
        {cover && (
          <CardMedia component="img" height="220" image={cover} alt={roomPack.room.Name} />
        )}
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <MeetingRoom sx={{ color: "#b8192b" }} />
              <Typography variant="h5" fontWeight={800}>
                Phòng {roomPack.room.Number}
              </Typography>
              <Chip size="small" sx={{ ml: 1 }} label={roomPack.type.Name} />
            </Stack>
            <Box sx={{ flex: 1 }} />
            <Chip
              variant={status === 'Under Maintenance' ? 'filled' : 'outlined'}
              icon={meta.icon as any}
              label={meta.label}
              sx={{
                fontWeight: 600,
                ...(status === 'Under Maintenance'
                  ? { backgroundColor: '#6a1b9a', color: '#fff' }
                  : {}),
              }}
            />
            <Button startIcon={<Edit />} onClick={() => setOpenStatusDlg(true)}>
              Đổi trạng thái
            </Button>
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" } }}>
          <Box>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Stack direction="row" spacing={1} alignItems="center">
                  <KingBed fontSize="small" />
                  <Typography variant="body2">
                    {roomPack.type.Number_of_Bed} giường
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <People fontSize="small" />
                  <Typography variant="body2">{roomPack.type.Capacity} người</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Giá cơ sở loại phòng: {formatVND(roomPack.type.Base_price)}
                </Typography>
              </Stack>
            </Box>
            <Box>
              <Stack alignItems={{ xs: "flex-start", md: "flex-end" }}>
                <Typography color="text.secondary" variant="body2">
                  Giá bán hiện tại
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ color: "#b8192b" }}>
                  {formatVND(roomPack.room.Price)}/đêm
                </Typography>
              </Stack>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        textColor="primary"
        indicatorColor="primary"
        sx={{ mb: 2 }}
      >
        <Tab label={`Tổng quan`} />
        <Tab label={`Tiện nghi (${facList.length})`} />
        <Tab label={`Hình ảnh (${imgList.length})`} />
        <Tab label={`Hoạt động (${activities.length})`} />
      </Tabs>

      {/* Tab panels */}
      {tab === 0 && (
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" } }}>
          <Box>
            <Stack spacing={2}>
              {/* Tổng quan: image + status + description + quick history */}
              <Card>
                <CardContent>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
                    {/* Image */}
                    <Box sx={{ width: { xs: '100%', md: 320 }, flexShrink: 0 }}>
                      {cover ? (
                        <CardMedia
                          component="img"
                          image={cover}
                          alt={roomPack.room.Name}
                          sx={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 1 }}
                        />
                      ) : (
                        <Box sx={{ width: '100%', height: 200, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary">No image</Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Summary: title + status + description + quick history */}
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="h6" fontWeight={700}>Phòng {roomPack.room.Number}</Typography>
                        <Chip
                          size="small"
                          label={meta.label}
                          variant={status === 'Under Maintenance' ? 'filled' : 'outlined'}
                          sx={{ ml: 1, ...(status === 'Under Maintenance' ? { backgroundColor: '#6a1b9a', color: '#fff' } : {}) }}
                        />
                        <Box sx={{ flex: 1 }} />
                      </Stack>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{roomPack.room.Description || "Không có mô tả ngắn."}</Typography>

                      <Divider sx={{ my: 2 }} />
                      {/* Short description shown above; quick history moved below as a separate card */}
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
              {/* Lịch sử nhanh (separate card below Tổng quan) */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Lịch sử nhanh
                  </Typography>
                  <Stack spacing={1}>
                    {activities && activities.length > 0 ? (
                      activities.slice(0, 5).map((a, idx) => (
                        <Alert key={idx} severity={(a.severity as any) || 'info'}>
                          {a.text ?? a.message ?? a.note ?? JSON.stringify(a)}
                        </Alert>
                      ))
                    ) : (
                      <Alert severity="info">Chưa có hoạt động gần đây.</Alert>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Box>

          <Box sx={{ position: { md: 'sticky' }, top: 96 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Lịch đặt — {new Date().toLocaleString('vi-VN', { month: 'long', year: 'numeric' })}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <MiniBookingCalendar bookings={bookings} roomStatus={status} />
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {tab === 1 && (
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6">Tiện nghi</Typography>
              <Button
                startIcon={<Add />}
                onClick={() => setOpenFacDlg(true)}
                disabled={!window.location.pathname.startsWith('/manager')}
              >
                Thêm tiện nghi
              </Button>
            </Stack>

            <Stack direction="row" gap={1} flexWrap="wrap">
              {facList.map((f) => (
                <Chip
                  key={f.Room_Facility_ID}
                  label={f.Name}
                  variant="outlined"
                  onDelete={() => removeFacility(f.Room_Facility_ID)}
                  deleteIcon={<DeleteOutline />}
                />
              ))}
              {facList.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Chưa có tiện nghi.
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {tab === 2 && (
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6">Hình ảnh</Typography>
              <Button
                startIcon={<UploadFile />}
                onClick={() => setOpenImgDlg(true)}
                disabled={!window.location.pathname.startsWith('/manager')}
              >
                Thêm hình
              </Button>
            </Stack>

            <ImageList cols={3} gap={12} sx={{ m: 0 }}>
              {imgList.map((it) => (
                <ImageListItem key={it.Room_Image_ID}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.URL} alt="" loading="lazy" style={{ borderRadius: 8 }} />
                  <Box sx={{ textAlign: "right", mt: 0.5 }}>
                    <Tooltip title="Xóa ảnh">
                      <IconButton size="small" onClick={() => removeImage(it.Room_Image_ID)} disabled={!window.location.pathname.startsWith('/manager')}>
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ImageListItem>
              ))}
              {imgList.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  Chưa có hình cho phòng này.
                </Typography>
              )}
            </ImageList>
          </CardContent>
        </Card>
      )}

      {tab === 3 && (
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr" } }}>
          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Hoạt động gần đây
                </Typography>
                <Stack spacing={1}>
                  <Alert severity="success">12/10 14:10 — Đổi trạng thái sang “Trống”.</Alert>
                  <Alert severity="info">11/10 18:30 — Upload thêm 2 ảnh phòng.</Alert>
                  <Alert severity="warning">09/10 09:00 — Đánh dấu “Bảo trì” do rò rỉ nước.</Alert>
                </Stack>
              </CardContent>
            </Card>
          </Box>
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Lịch đặt — {new Date().toLocaleString('vi-VN', { month: 'long', year: 'numeric' })}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <MiniBookingCalendar bookings={bookings} roomStatus={status} />
                  </Box>
                </CardContent>
              </Card>
            </Box>
        </Box>
      )}

      {/* Dialog: đổi trạng thái */}
      <Dialog open={openStatusDlg} onClose={() => setOpenStatusDlg(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Đổi trạng thái phòng</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth>
            <InputLabel>Trạng thái</InputLabel>
            <Select
              label="Trạng thái"
              value={status}
              onChange={(e: SelectChangeEvent<RoomStatus>) =>
                setStatus(e.target.value as RoomStatus)
              }
            >
              {(Object.keys(STATUS_META) as RoomStatus[]).map((s) => (
                <MenuItem key={s} value={s}>
                  {STATUS_META[s].label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Alert severity="info" sx={{ mt: 2 }}>
            Thao tác này chỉ thay đổi trên UI (demo). Khi nối API, hãy gọi endpoint cập nhật
            trạng thái phòng.
          </Alert>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setOpenStatusDlg(false)}>Hủy</Button>
            <Button variant="contained" onClick={async () => {
              try {
                setOpenStatusDlg(false);
                await handleChangeStatus(status);
              } catch (e) {
                console.error('Failed to update room status', e);
              }
            }}>
              Lưu
            </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: thêm tiện nghi */}
      <Dialog open={openFacDlg} onClose={() => setOpenFacDlg(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Thêm tiện nghi</DialogTitle>
        <DialogContent dividers>
            <TextField
              fullWidth
              label="Tên tiện nghi"
              value={facToAdd}
              onChange={(e) => setFacToAdd(e.target.value)}
              placeholder="Ví dụ: Wi-Fi, A/C, Tủ lạnh"
            />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFacDlg(false)}>Hủy</Button>
          <Button variant="contained" onClick={addFacility}>
            Thêm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: thêm hình ảnh */}
      <Dialog open={openImgDlg} onClose={() => setOpenImgDlg(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm hình ảnh</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="URL hình ảnh"
            value={newImgUrl}
            onChange={(e) => setNewImgUrl(e.target.value)}
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            UI demo — bạn có thể dán URL ảnh (Unsplash, CDN…). Khi nối API, thay bằng upload file.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImgDlg(false)}>Hủy</Button>
          <Button variant="contained" onClick={addImage}>
            Thêm
          </Button>
        </DialogActions>
      </Dialog>
      {/* Snackbar for status changes (with undo) */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMsg || ''}
        action={
          <Button color="inherit" size="small" onClick={handleUndoStatus}>
            HOÀN TÁC
          </Button>
        }
      />
    </Box>
  );
}
