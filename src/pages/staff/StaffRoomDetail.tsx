import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemText,
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
  useMediaQuery,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { useParams, Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from '@mui/material/styles';
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
import GuestReservationWizard from '../../components/GuestReservationWizard';
import RoomImageUpload from '../../components/RoomImageUpload';

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
  const location = useLocation();
  // fetch live data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // default to Activity tab
  const [tab, setTab] = useState(3);
  const [openStatusDlg, setOpenStatusDlg] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // snackbar for status-change feedback + undo
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState<string | null>(null);
  const [prevStatus, setPrevStatus] = useState<RoomStatus | null>(null);

  const [room, setRoom] = useState<Room | null>(null);
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [rawPayload, setRawPayload] = useState<any>(null);
  const [imgList, setImgList] = useState<RoomImage[]>([]);
  const [facList, setFacList] = useState<RoomFacility[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  const [openFacDlg, setOpenFacDlg] = useState(false);
  const [facToAdd, setFacToAdd] = useState<string>("");
  const [openImgDlg, setOpenImgDlg] = useState(false);
  const [newImgUrl, setNewImgUrl] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedPreviews, setSelectedPreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [deletingImageIds, setDeletingImageIds] = useState<number[]>([]);

  // wizard for reservation/stay creation
  const [openWizard, setOpenWizard] = useState(false);
  const [wizardMode, setWizardMode] = useState<'reserve' | 'occupy'>('reserve');
  // assign dialog: choose existing reservation/stay or create new
  const [openAssignDlg, setOpenAssignDlg] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [reservationResults, setReservationResults] = useState<any[]>([]);
  const [stayResults, setStayResults] = useState<any[]>([]);
  const [searchingReservations, setSearchingReservations] = useState(false);
  const [loadingStays, setLoadingStays] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [selectedStayId, setSelectedStayId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  const theme = useTheme();
  const upSm = useMediaQuery(theme.breakpoints.up('sm'));
  const upMd = useMediaQuery(theme.breakpoints.up('md'));
  const upLg = useMediaQuery(theme.breakpoints.up('lg'));
  const isManager = typeof window !== 'undefined' && window.location.pathname.startsWith('/manager');
  const cols = upLg ? 5 : upMd ? 4 : upSm ? 3 : 2;

  // create and revoke object URLs for previews
  useEffect(() => {
    // preview management kept for legacy selectedFiles usage
    if (!selectedFiles || selectedFiles.length === 0) {
      setSelectedPreviews([]);
      return;
    }
    const urls = selectedFiles.map((f) => URL.createObjectURL(f));
    setSelectedPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [selectedFiles]);

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
        setRawPayload(payload);
        setImgList(images);
        setFacList(facilities);
        // initial activities from payload (if any)
        setActivities(acts);
        setBookings(normalizedBookings);
        console.log('room payload bookings (after fetch):', normalizedBookings);

        // If URL requests to open image dialog immediately (wizard flow)
        try {
          const qp = new URLSearchParams(location.search);
          if (qp.get('openImg') === 'true') {
            setOpenImgDlg(true);
          }
        } catch (e) {
          // ignore parse errors
        }

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
    // Request to join the room-specific channel so server can emit scoped events
    socket.on('connect', () => {
      try {
        socket.emit('join_room', { roomId });
      } catch (e) {
        // ignore
      }
    });
    socket.on('joined_room', (d) => {
      console.log('Joined room channel', d);
    });

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
      setUpdatingStatus(true);
      setStatus(newStatus);
      // keep the loaded room object in sync for other UI bits
      setRoom((r) => (r ? { ...r, Status: newStatus } : r));
      // Use the route param `roomId` (ObjectId string) — backend expects the original id string
      await api.put(`/rooms/${roomId}`, { status: newStatus });
      showStatusSnackbar(`Trạng thái đã đổi thành “${STATUS_META[newStatus].label}”`, old);
    } catch (e) {
      console.error('Failed to update room status', e);
      // revert on error
      setStatus(old);
      setRoom((r) => (r ? { ...r, Status: old } : r));
      showStatusSnackbar('Không thể thay đổi trạng thái (lỗi).', old);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUndoStatus = async () => {
    if (!room || prevStatus == null) return;
    try {
      setUpdatingStatus(true);
      await api.put(`/rooms/${roomId}`, { status: prevStatus });
      setStatus(prevStatus);
      setRoom((r) => (r ? { ...r, Status: prevStatus } : r));
      setSnackbarOpen(false);
    } catch (e) {
      console.error('Failed to undo status', e);
    }
    finally {
      setUpdatingStatus(false);
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
    (async () => {
      try {
        // Only handle URL fallback here; file uploads are handled by RoomImageUpload when roomId is present
        if (!newImgUrl.trim()) return;
        const currentUrls = imgList.map((it) => it.URL);
        const next = [...currentUrls, newImgUrl.trim()];
        const res = await api.put(`/rooms/${roomId}`, { images: next });
        const roomPayload = res.data || res.data?.data || {};
        const imgs: RoomImage[] = Array.isArray(roomPayload.images)
          ? roomPayload.images.map((u: any, i: number) => ({ Room_Image_ID: i + 1, URL: u, Room_ID: Number(roomId) }))
          : [];
        setImgList(imgs);
        setNewImgUrl("");
        setOpenImgDlg(false);
      } catch (err) {
        console.error('Failed to add image URL', err);
        alert('Thêm URL hình thất bại');
      }
    })();
  };

  const removeImage = async (id: number) => {
    const item = imgList.find((x) => x.Room_Image_ID === id);
    if (!item) return;
    const imageUrl = item.URL;
    if (!isManager) {
      // staff are not allowed to delete images
      alert('Bạn không có quyền xóa ảnh.');
      return;
    }

    try {
      // mark deleting state for this tile
      setDeletingImageIds((s) => [...s, id]);
      // call backend to delete image (body: { image })
      const res = await api.delete(`/rooms/${roomId}/images`, { data: { image: imageUrl } });
      const roomPayload = res.data?.data || res.data || {};
      const imgs: RoomImage[] = Array.isArray(roomPayload.images)
        ? roomPayload.images.map((u: any, i: number) => ({ Room_Image_ID: i + 1, URL: u, Room_ID: Number(roomId) }))
        : [];
      setImgList(imgs);
    } catch (err) {
      console.error('Failed to delete image', err);
      alert('Xóa ảnh thất bại. Vui lòng thử lại.');
    } finally {
      setDeletingImageIds((s) => s.filter((x) => x !== id));
    }
  };

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

            <Box sx={{ maxHeight: 420, overflowY: 'auto', pr: 1 }}>
              <ImageList cols={cols} gap={12} sx={{ m: 0, gridAutoRows: '140px' }}>
                {imgList.map((it) => (
                  <ImageListItem
                    key={it.Room_Image_ID}
                    sx={{
                      position: 'relative',
                      borderRadius: 1,
                      overflow: 'hidden',
                      // ensure consistent tile height in css grid
                      '& img': { width: '100%', height: '100%', objectFit: 'cover', display: 'block' }
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.URL} alt="" loading="lazy" />

                    <Box sx={{ position: 'absolute', top: 6, right: 6 }}>
                      <Tooltip title="Xóa ảnh">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => removeImage(it.Room_Image_ID)}
                            disabled={!isManager || deletingImageIds.includes(it.Room_Image_ID)}
                            sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}
                          >
                            {deletingImageIds.includes(it.Room_Image_ID) ? (
                              <CircularProgress size={18} />
                            ) : (
                              <DeleteOutline fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </ImageListItem>
                ))}
              </ImageList>
            </Box>
            {imgList.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Chưa có hình cho phòng này.
              </Typography>
            )}
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
                    {activities && activities.length > 0 ? (
                      activities.slice(0, 10).map((a: any, idx: number) => {
                        const severity = (a.severity as any) ||
                          (a.type === 'status_change' ? 'success' : 'info');
                        const when = a.createdAt ? new Date(a.createdAt).toLocaleString('vi-VN') : '';
                        const who = a.user?.fullname || a.user?.username || a.user || null;
                        const text = a.text ?? a.message ?? a.note ?? (a.meta && a.meta.note) ?? JSON.stringify(a);
                        return (
                          <Alert key={a._id || idx} severity={severity}>
                            <strong style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>{when}{who ? ` — ${who}` : ''}</strong>
                            <span>{text}</span>
                          </Alert>
                        );
                      })
                    ) : (
                      <Alert severity="info">Chưa có hoạt động gần đây.</Alert>
                    )}
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
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setOpenStatusDlg(false)}>Hủy</Button>
            <Button
              variant="contained"
              disabled={updatingStatus}
              onClick={async () => {
                try {
                  setOpenStatusDlg(false);
                  // If manager attempts to set to Reserved/Occupied, show snackbar and do not perform change
                  const isReservedOrOccupied = status === 'Reserved' || status === 'Occupied';
                  if (isManager && isReservedOrOccupied) {
                    setSnackbarMsg('Chỉ nhân viên lễ tân mới có quyền đặt/gán phòng (Reserved/Occupied). Vui lòng dùng tài khoản Staff để thao tác.');
                    setSnackbarOpen(true);
                    return;
                  }
                  // If staff is changing to Reserved/Occupied, open the assign wizard to attach reservation/stay
                  if (!isManager && isReservedOrOccupied) {
                    setOpenAssignDlg(true);
                    return;
                  }
                  await handleChangeStatus(status);
                } catch (e) {
                  console.error('Failed to update room status', e);
                }
              }}
            >
              {updatingStatus ? <CircularProgress color="inherit" size={18} /> : 'Lưu'}
            </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: assign/attach to existing reservation or stay */}
      <Dialog open={openAssignDlg} onClose={() => setOpenAssignDlg(false)} maxWidth="md" fullWidth>
        <DialogTitle>Gán phòng vào đơn / stay hiện có</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 1 }}>Chọn một tuỳ chọn hoặc tạo đặt phòng mới.</Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField
              label="Tìm reservation (tên, phone, mã)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
            />
            <Button variant="outlined" onClick={async () => {
              try {
                setSearchingReservations(true);
                const res = await api.get(`/dashboard/checkin/search`, { params: { query: searchQuery } });
                setReservationResults(res.data?.results || []);
              } catch (err) {
                console.error('Reservation search failed', err);
                setReservationResults([]);
              } finally { setSearchingReservations(false); }
            }}>Tìm</Button>
            <Button variant="text" onClick={async () => {
              // load in-house stays
              try {
                setLoadingStays(true);
                const r = await api.get(`/dashboard/checkout/inhouse`);
                setStayResults(r.data?.inHouse || []);
              } catch (e) { console.error('Load stays failed', e); setStayResults([]); }
              finally { setLoadingStays(false); }
            }}>Tải stays</Button>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2">Reservations</Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #eee', borderRadius: 1, p: 1 }}>
                {searchingReservations ? <CircularProgress size={20} /> : (
                  reservationResults.length === 0 ? <Typography variant="body2" color="text.secondary">Không tìm thấy.</Typography> : (
                    <List dense>
                      {reservationResults.map((r:any) => (
                        <ListItem key={r.id} button selected={selectedReservationId === String(r.id)} onClick={() => { setSelectedReservationId(String(r.id)); setSelectedStayId(null); }}>
                          <ListItemText primary={r.customer?.fullname || (r.customer && `${r.customer.fullname}`) || String(r.id)} secondary={`${new Date(r.checkInDate).toLocaleDateString()} → ${new Date(r.checkOutDate).toLocaleDateString()}`} />
                        </ListItem>
                      ))}
                    </List>
                  )
                )}
              </Box>
            </Box>

            <Box sx={{ width: 360 }}>
              <Typography variant="subtitle2">In-house stays</Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #eee', borderRadius: 1, p: 1 }}>
                {loadingStays ? <CircularProgress size={20} /> : (
                  stayResults.length === 0 ? <Typography variant="body2" color="text.secondary">Chưa có khách đang trọ.</Typography> : (
                    <List dense>
                      {stayResults.map((s:any, idx:number) => (
                        <ListItem key={s.stayId || idx} button selected={selectedStayId === String(s.stayId)} onClick={() => { setSelectedStayId(String(s.stayId)); setSelectedReservationId(null); }}>
                          <ListItemText primary={`${s.roomNumber || s.roomNumber || s.roomId || s.roomNumber || 'Room'}`} secondary={`${s.guestName || 'Khách'} — ${s.roomType || ''}`} />
                        </ListItem>
                      ))}
                    </List>
                  )
                )}
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenAssignDlg(false); }}>Hủy</Button>
          <Button onClick={() => { setOpenAssignDlg(false); setWizardMode(status === 'Reserved' ? 'reserve' : 'occupy'); setOpenWizard(true); }}>
            Tạo mới
          </Button>
          <Button variant="contained" disabled={assigning || (!selectedReservationId && !selectedStayId)} onClick={async () => {
            try {
              setAssigning(true);
              if (selectedReservationId) {
                await api.post(`/reservations/${selectedReservationId}/assign-room`, { roomId, status: status });
              } else if (selectedStayId) {
                await api.post(`/dashboard/stays/${selectedStayId}/rooms`, { roomId, guests: [] });
              }
              setOpenAssignDlg(false);
              // refresh room data and activities (reuse existing refresh logic)
              try {
                const res = await api.get(`/rooms/public/${roomId}`);
                const payload = res.data?.data || res.data || {};
                setRawPayload(payload);
                const mappedRoom = {
                  Room_ID: Number(payload._id ?? payload.id ?? roomId),
                  RoomType_ID: Number(payload.roomType?._id ?? payload.roomType?.id ?? payload.roomType ?? 0),
                  Number: String(payload.roomNumber ?? payload.number ?? payload.code ?? payload.name ?? roomId),
                  Name: payload.name ?? payload.title ?? `Room ${payload.roomNumber ?? roomId}`,
                  Description: payload.description ?? payload.note,
                  Price: Number(payload.pricePerNight ?? payload.price ?? payload.roomType?.basePrice ?? 0),
                  Status: (payload.status as RoomStatus) ?? (payload.state as RoomStatus) ?? 'Available',
                  Hotel_ID: Number(payload.hotel?._id ?? payload.hotel?.id ?? payload.hotelId ?? 0),
                };
                setRoom(mappedRoom as any);
                const imgs: any[] = Array.isArray(payload.images) ? payload.images.map((u: any, i: number) => ({ Room_Image_ID: i + 1, URL: u, Room_ID: mappedRoom.Room_ID })) : [];
                setImgList(imgs);
                try { const aRes = await api.get(`/rooms/${roomId}/activities?limit=20`); if (aRes?.data?.data) setActivities(aRes.data.data); } catch (e) {}
              } catch (e) { console.warn('Failed refresh after assign', e); }
              setSnackbarMsg('Gán phòng thành công');
              setSnackbarOpen(true);
            } catch (err) {
              console.error('Assign failed', err);
              alert('Gán phòng thất bại. Vui lòng thử lại.');
            } finally { setAssigning(false); }
          }}>
            {assigning ? <CircularProgress size={18} color="inherit" /> : 'Gán phòng'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reservation / Stay wizard for staff */}
      <GuestReservationWizard
        open={openWizard}
        mode={wizardMode}
        roomId={roomId ?? ''}
        roomPayload={rawPayload}
        onClose={() => setOpenWizard(false)}
        onSuccess={(data) => {
          // refresh room data and activities
          (async () => {
            try {
              const res = await api.get(`/rooms/public/${roomId}`);
              const payload = res.data?.data || res.data || {};
              setRawPayload(payload);
              // update mapped room and lists similar to initial fetch
              const mappedRoom = {
                Room_ID: Number(payload._id ?? payload.id ?? roomId),
                RoomType_ID: Number(payload.roomType?._id ?? payload.roomType?.id ?? payload.roomType ?? 0),
                Number: String(payload.roomNumber ?? payload.number ?? payload.code ?? payload.name ?? roomId),
                Name: payload.name ?? payload.title ?? `Room ${payload.roomNumber ?? roomId}`,
                Description: payload.description ?? payload.note,
                Price: Number(payload.pricePerNight ?? payload.price ?? payload.roomType?.basePrice ?? 0),
                Status: (payload.status as RoomStatus) ?? (payload.state as RoomStatus) ?? 'Available',
                Hotel_ID: Number(payload.hotel?._id ?? payload.hotel?.id ?? payload.hotelId ?? 0),
              };
              setRoom(mappedRoom as any);
              const images: any[] = Array.isArray(payload.images) ? payload.images.map((u: any, i: number) => ({ Room_Image_ID: i + 1, URL: u, Room_ID: mappedRoom.Room_ID })) : [];
              setImgList(images);
              // pull latest activities
              try { const aRes = await api.get(`/rooms/${roomId}/activities?limit=20`); if (aRes?.data?.data) setActivities(aRes.data.data); } catch (e) {}
            } catch (e) {
              console.warn('Failed refresh after wizard success', e);
            }
          })();
          setSnackbarMsg('Tạo đặt phòng / check-in thành công');
          setSnackbarOpen(true);
        }}
      />

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
            label="URL hình ảnh (hoặc để trống và chọn file)"
            value={newImgUrl}
            onChange={(e) => setNewImgUrl(e.target.value)}
            placeholder="https://..."
            sx={{ mb: 2 }}
          />
          <RoomImageUpload roomId={roomId} onUploaded={(imgs) => {
            const images = Array.isArray(imgs) ? imgs.map((u, i) => ({ Room_Image_ID: i + 1, URL: u, Room_ID: Number(roomId) })) : [];
            setImgList(images);
            setOpenImgDlg(false);
          }} />
          <Alert severity="info" sx={{ mt: 1 }}>
            Chọn file sẽ upload trực tiếp lên server (Cloudinary). Nếu dán URL, hệ thống sẽ lưu URL đó.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImgDlg(false)} disabled={uploadingImages}>Hủy</Button>
          <Button variant="contained" onClick={addImage} disabled={uploadingImages}>
            {uploadingImages ? <CircularProgress color="inherit" size={18} /> : 'Thêm'}
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
