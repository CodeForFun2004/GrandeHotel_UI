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

  const [tab, setTab] = useState(0);
  const [openStatusDlg, setOpenStatusDlg] = useState(false);

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
        const bks = Array.isArray(payload.bookings) ? payload.bookings : Array.isArray(payload.reservations) ? payload.reservations : [];

        setRoom(mappedRoom);
        setRoomType(mappedType);
        setImgList(images);
        setFacList(facilities);
        setActivities(acts);
        setBookings(bks);
      } catch (e: any) {
        console.error('Fetch room failed', e);
        setError(e?.response?.data?.message || e?.message || 'Failed to load room');
      } finally {
        setLoading(false);
      }
    };
    doFetch();
  }, [roomId]);

  const meta = STATUS_META[status];
  const cover = imgList[0]?.URL;

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
              color={meta.color}
              variant="outlined"
              icon={meta.icon as any}
              label={meta.label}
              sx={{ fontWeight: 600 }}
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
        <Tab label="Tổng quan" />
        <Tab label={`Tiện nghi (${facList.length})`} />
        <Tab label={`Hình ảnh (${imgList.length})`} />
        <Tab label="Hoạt động" />
      </Tabs>

      {/* Tab panels */}
      {tab === 0 && (
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" } }}>
          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Mô tả
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {roomPack.room.Description ||
                    "Không có mô tả. Đây là phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản, phù hợp cho 2 khách."}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>
                  Lịch sử nhanh
                </Typography>
                <Stack spacing={1}>
                  {activities.length > 0 ? (
                    activities.slice(0, 5).map((a, idx) => (
                      <Alert key={idx} severity={a.severity || 'info'}>
                        {a.text ?? a.message ?? JSON.stringify(a)}
                      </Alert>
                    ))
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
                  Thao tác nhanh
                </Typography>
                <Stack spacing={1}>
                  <Button variant="outlined" startIcon={<Build />} disabled={status === "Under Maintenance"} onClick={() => setStatus("Under Maintenance")}>
                    Đánh dấu bảo trì
                  </Button>
                  <Button variant="outlined" startIcon={<ReportProblem />} disabled={status === "Out of Order"} onClick={() => setStatus("Out of Order")}>
                    Đánh dấu OOO (hỏng)
                  </Button>
                  <Button variant="contained" color="success" startIcon={<CheckCircle />} disabled={status === "Available"} onClick={() => setStatus("Available")}>
                    Mở bán (Trống)
                  </Button>
                </Stack>
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
              <Button startIcon={<Add />} onClick={() => setOpenFacDlg(true)}>
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
              <Button startIcon={<UploadFile />} onClick={() => setOpenImgDlg(true)}>
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
                      <IconButton size="small" onClick={() => removeImage(it.Room_Image_ID)}>
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
                  Lịch đặt (minimap — UI demo)
                </Typography>
                {bookings.length > 0 ? (
                  <Stack spacing={1}>
                    {bookings.map((b: any, i: number) => (
                      <Box key={i} sx={{ borderRadius: 1, p: 1, border: '1px solid #eee' }}>
                        <Typography variant="body2">{b.guestName ?? b.name ?? b.customer ?? 'Khách'}</Typography>
                        <Typography variant="caption" color="text.secondary">{`${b.checkIn ?? b.start ?? ''} → ${b.checkOut ?? b.end ?? ''}`}</Typography>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Box sx={{ height: 180, borderRadius: 1, border: '1px dashed #ddd', bgcolor: '#fafafa', display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
                    Không có lịch đặt để hiển thị.
                  </Box>
                )}
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
                if (!room) return;
                const payload = { status };
                await api.put(`/rooms/${room.Room_ID}`, payload);
                setStatus(status);
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
    </Box>
  );
}
