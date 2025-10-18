import React, { useMemo, useState } from "react";
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

type FacilityType = { FacilityType_ID: number; Name: string; Description?: string };
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
   Mock data (UI only)
========================= */
const ROOM_TYPES: RoomType[] = [
  { RoomType_ID: 1, Name: "Standard", Number_of_Bed: 1, Capacity: 2, Base_price: 900_000 },
  { RoomType_ID: 2, Name: "Deluxe", Number_of_Bed: 1, Capacity: 3, Base_price: 1_500_000 },
  { RoomType_ID: 3, Name: "Suite", Number_of_Bed: 2, Capacity: 4, Base_price: 2_500_000 },
];

const ROOMS: Room[] = [
  { Room_ID: 1, RoomType_ID: 1, Number: "101", Name: "Standard 101", Price: 1_100_000, Status: "Available", Hotel_ID: 1 },
  { Room_ID: 2, RoomType_ID: 2, Number: "102", Name: "Deluxe 102", Price: 1_800_000, Status: "Occupied", Hotel_ID: 1 },
  { Room_ID: 3, RoomType_ID: 1, Number: "103", Name: "Standard 103", Price: 1_000_000, Status: "Reserved", Hotel_ID: 1 },
  { Room_ID: 4, RoomType_ID: 3, Number: "201", Name: "Suite 201", Price: 2_700_000, Status: "Available", Hotel_ID: 1 },
  { Room_ID: 5, RoomType_ID: 2, Number: "202", Name: "Deluxe 202", Price: 1_900_000, Status: "Under Maintenance", Hotel_ID: 1 },
  { Room_ID: 6, RoomType_ID: 1, Number: "203", Name: "Standard 203", Price: 1_050_000, Status: "Out of Order", Hotel_ID: 1 },
];

const ROOM_IMAGES: RoomImage[] = [
  { Room_Image_ID: 1, URL: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1600&auto=format&fit=crop", Room_ID: 1 },
  { Room_Image_ID: 2, URL: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1600&auto=format&fit=crop", Room_ID: 1 },
  { Room_Image_ID: 3, URL: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1600&auto=format&fit=crop", Room_ID: 2 },
  { Room_Image_ID: 4, URL: "https://images.unsplash.com/photo-1505691723518-36a5ac3b2b8f?q=80&w=1600&auto=format&fit=crop", Room_ID: 4 },
];

const FACILITY_TYPES: FacilityType[] = [
  { FacilityType_ID: 1, Name: "A/C" },
  { FacilityType_ID: 2, Name: "Wi-Fi" },
  { FacilityType_ID: 3, Name: "TV" },
  { FacilityType_ID: 4, Name: "Bathtub" },
  { FacilityType_ID: 5, Name: "Balcony" },
];

const ROOM_FACILITIES: RoomFacility[] = [
  { Room_Facility_ID: 1, Room_ID: 1, FacilityType_ID: 1, Name: "A/C", Status: "Available" },
  { Room_Facility_ID: 2, Room_ID: 1, FacilityType_ID: 2, Name: "Wi-Fi", Status: "Available" },
  { Room_Facility_ID: 3, Room_ID: 1, FacilityType_ID: 3, Name: "TV", Status: "Available" },
  { Room_Facility_ID: 4, Room_ID: 1, FacilityType_ID: 4, Name: "Bathtub", Status: "Available" },
  { Room_Facility_ID: 5, Room_ID: 2, FacilityType_ID: 2, Name: "Wi-Fi", Status: "Available" },
];

/* =========================
   Component
========================= */
export default function StaffRoomDetail() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  // join data
  const roomPack = useMemo(() => {
    const id = Number(roomId ?? 1);
    const room = ROOMS.find((r) => r.Room_ID === id) ?? ROOMS[0];
    const type = ROOM_TYPES.find((t) => t.RoomType_ID === room.RoomType_ID)!;
    const images = ROOM_IMAGES.filter((i) => i.Room_ID === room.Room_ID);
    const facilities = ROOM_FACILITIES.filter((f) => f.Room_ID === room.Room_ID);
    return { room, type, images, facilities };
  }, [roomId]);

  // local UI state
  const [tab, setTab] = useState(0);
  const [status, setStatus] = useState<RoomStatus>(roomPack.room.Status);
  const [openStatusDlg, setOpenStatusDlg] = useState(false);

  // facilities mock editing
  const [facList, setFacList] = useState<RoomFacility[]>(roomPack.facilities);
  const [openFacDlg, setOpenFacDlg] = useState(false);
  const [facToAdd, setFacToAdd] = useState<number>(FACILITY_TYPES[0].FacilityType_ID);

  // images mock editing
  const [imgList, setImgList] = useState<RoomImage[]>(
    ROOM_IMAGES.filter((i) => i.Room_ID === roomPack.room.Room_ID)
  );
  const [openImgDlg, setOpenImgDlg] = useState(false);
  const [newImgUrl, setNewImgUrl] = useState("");

  const meta = STATUS_META[status];
  const cover = imgList[0]?.URL;

  const addFacility = () => {
    const ft = FACILITY_TYPES.find((x) => x.FacilityType_ID === facToAdd)!;
    setFacList((arr) => [
      ...arr,
      {
        Room_Facility_ID: Date.now(),
        Room_ID: roomPack.room.Room_ID,
        FacilityType_ID: ft.FacilityType_ID,
        Name: ft.Name,
        Status: "Available",
      },
    ]);
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
                  <Alert severity="info">10/10: Vệ sinh phòng hoàn tất.</Alert>
                  <Alert severity="success">08/10: Khách check-out, không phát sinh.</Alert>
                  <Alert severity="warning">05/10: Bảo trì vòi sen — đã xử lý.</Alert>
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
                <Box
                  sx={{
                    height: 180,
                    borderRadius: 1,
                    border: "1px dashed #ddd",
                    bgcolor: "#fafafa",
                    display: "grid",
                    placeItems: "center",
                    color: "text.secondary",
                  }}
                >
                  Calendar preview (mock)
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
          <Button variant="contained" onClick={() => setOpenStatusDlg(false)}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: thêm tiện nghi */}
      <Dialog open={openFacDlg} onClose={() => setOpenFacDlg(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Thêm tiện nghi</DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth>
            <InputLabel>Loại tiện nghi</InputLabel>
            <Select
              label="Loại tiện nghi"
              value={facToAdd}
              onChange={(e) => setFacToAdd(Number(e.target.value))}
            >
              {FACILITY_TYPES.map((f) => (
                <MenuItem key={f.FacilityType_ID} value={f.FacilityType_ID}>
                  {f.Name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
