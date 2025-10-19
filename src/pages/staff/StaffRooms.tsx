import React, { useMemo, useState } from "react";
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
} from "@mui/material";
import {
  MeetingRoom,
  KingBed,
  People,
  CheckCircle,
  EventBusy,
  DoNotDisturb,
  Build,
  ReportProblem,
  ChevronRight,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

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
   Types (khớp ERD)
---------------------------- */
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

type FacilityType = {
  FacilityType_ID: number;
  Name: string;
  Description?: string;
};

type RoomFacility = {
  Room_Facility_ID: number;
  Room_ID: number;
  FacilityType_ID: number;
  Name: string; // denormalized for UI
  Description?: string;
  Status: RoomStatus;
};

type RoomImage = {
  Room_Image_ID: number;
  URL: string;
  Room_ID: number;
};

type Room = {
  Room_ID: number;
  RoomType_ID: number;
  Number: string; // số phòng
  Name: string;
  Description?: string;
  Price: number;
  Status: RoomStatus;
  Hotel_ID: number;
};

/* ----------------------------
   Mock data (UI only)
---------------------------- */
const ROOM_TYPES: RoomType[] = [
  { RoomType_ID: 1, Name: "Standard", Number_of_Bed: 1, Capacity: 2, Base_price: 900_000 },
  { RoomType_ID: 2, Name: "Deluxe", Number_of_Bed: 1, Capacity: 3, Base_price: 1_500_000 },
  { RoomType_ID: 3, Name: "Suite", Number_of_Bed: 2, Capacity: 4, Base_price: 2_500_000 },
];

const FACILITY_TYPES: FacilityType[] = [
  { FacilityType_ID: 1, Name: "A/C" },
  { FacilityType_ID: 2, Name: "Wi-Fi" },
  { FacilityType_ID: 3, Name: "TV" },
  { FacilityType_ID: 4, Name: "Bathtub" },
  { FacilityType_ID: 5, Name: "Balcony" },
];

const INIT_ROOMS: Room[] = [
  { Room_ID: 1, RoomType_ID: 1, Number: "101", Name: "Standard 101", Price: 1_100_000, Status: "Available", Hotel_ID: 1 },
  { Room_ID: 2, RoomType_ID: 2, Number: "102", Name: "Deluxe 102", Price: 1_800_000, Status: "Occupied", Hotel_ID: 1 },
  { Room_ID: 3, RoomType_ID: 1, Number: "103", Name: "Standard 103", Price: 1_000_000, Status: "Reserved", Hotel_ID: 1 },
  { Room_ID: 4, RoomType_ID: 3, Number: "201", Name: "Suite 201", Price: 2_700_000, Status: "Available", Hotel_ID: 1 },
  { Room_ID: 5, RoomType_ID: 2, Number: "202", Name: "Deluxe 202", Price: 1_900_000, Status: "Under Maintenance", Hotel_ID: 1 },
  { Room_ID: 6, RoomType_ID: 1, Number: "203", Name: "Standard 203", Price: 1_050_000, Status: "Out of Order", Hotel_ID: 1 },
];

const ROOM_IMAGES: RoomImage[] = [
  { Room_Image_ID: 1, URL: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop", Room_ID: 1 },
  { Room_Image_ID: 2, URL: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1200&auto=format&fit=crop", Room_ID: 2 },
  { Room_Image_ID: 3, URL: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200&auto=format&fit=crop", Room_ID: 3 },
  { Room_Image_ID: 4, URL: "https://aeros.vn/upload/images/aeros-phong-suite-la-gi-1.webp", Room_ID: 4 },
  { Room_Image_ID: 5, URL: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1200&auto=format&fit=crop", Room_ID: 5 },
  { Room_Image_ID: 6, URL: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200&auto=format&fit=crop", Room_ID: 6 },
];

const ROOM_FACILITIES: RoomFacility[] = [
  { Room_Facility_ID: 1, Room_ID: 1, FacilityType_ID: 1, Name: "A/C", Status: "Available" },
  { Room_Facility_ID: 2, Room_ID: 1, FacilityType_ID: 2, Name: "Wi-Fi", Status: "Available" },
  { Room_Facility_ID: 3, Room_ID: 1, FacilityType_ID: 3, Name: "TV", Status: "Available" },
  { Room_Facility_ID: 4, Room_ID: 2, FacilityType_ID: 1, Name: "A/C", Status: "Available" },
  { Room_Facility_ID: 5, Room_ID: 2, FacilityType_ID: 2, Name: "Wi-Fi", Status: "Available" },
  { Room_Facility_ID: 6, Room_ID: 2, FacilityType_ID: 4, Name: "Bathtub", Status: "Available" },
  { Room_Facility_ID: 7, Room_ID: 3, FacilityType_ID: 1, Name: "A/C", Status: "Available" },
  { Room_Facility_ID: 8, Room_ID: 3, FacilityType_ID: 2, Name: "Wi-Fi", Status: "Available" },
  { Room_Facility_ID: 9, Room_ID: 4, FacilityType_ID: 5, Name: "Balcony", Status: "Available" },
  { Room_Facility_ID: 10, Room_ID: 4, FacilityType_ID: 3, Name: "TV", Status: "Available" },
  { Room_Facility_ID: 11, Room_ID: 5, FacilityType_ID: 2, Name: "Wi-Fi", Status: "Available" },
  { Room_Facility_ID: 12, Room_ID: 6, FacilityType_ID: 1, Name: "A/C", Status: "Available" },
];

/* ----------------------------
   UI Config
---------------------------- */
const STATUS_META: Record<
  RoomStatus,
  { color: "default" | "success" | "warning" | "error"; label: string; icon: React.ReactNode }
> = {
  "Available": { color: "success", label: "Trống", icon: <CheckCircle fontSize="small" /> },
  "Reserved": { color: "warning", label: "Giữ chỗ", icon: <EventBusy fontSize="small" /> },
  "Occupied": { color: "error", label: "Đang ở", icon: <DoNotDisturb fontSize="small" /> },
  "Under Maintenance": { color: "warning", label: "Bảo trì", icon: <Build fontSize="small" /> },
  "Closed": { color: "default", label: "Đóng", icon: <DoNotDisturb fontSize="small" /> },
  "Out of Order": { color: "default", label: "Hỏng (OOO)", icon: <ReportProblem fontSize="small" /> },
};

const StaffRooms: React.FC = () => {
  const navigate = useNavigate();

  // Local copy để thao tác UI
  const [rooms, setRooms] = useState<Room[]>(INIT_ROOMS);

  /* Filters */
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<RoomStatus | "ALL">("ALL");
  const [typeId, setTypeId] = useState<number | "ALL">("ALL");

  // Snackbar
  const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: "success" | "info" | "warning" | "error" }>({
    open: false,
    msg: "",
    severity: "success",
  });

  // Assign / Reserve dialog
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignRoom, setAssignRoom] = useState<Room | null>(null);
  const [assignMode, setAssignMode] = useState<"reserve" | "checkin">("reserve");
  const [guestName, setGuestName] = useState("");
  const [ci, setCi] = useState("");
  const [co, setCo] = useState("");
  const [sellPrice, setSellPrice] = useState<number>(0);

  // Action dialogs for Reserved / Occupied
  const [reservedDlg, setReservedDlg] = useState<Room | null>(null);
  const [occupiedDlg, setOccupiedDlg] = useState<Room | null>(null);

  // Maintenance menu
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuRoom, setMenuRoom] = useState<Room | null>(null);

  // join & filter theo ERD
  const data = useMemo(() => {
    const enriched = rooms.map((r) => {
      const type = ROOM_TYPES.find((t) => t.RoomType_ID === r.RoomType_ID)!;
      const imgs = ROOM_IMAGES.filter((i) => i.Room_ID === r.Room_ID);
      const facs = ROOM_FACILITIES.filter((f) => f.Room_ID === r.Room_ID).map((f) => f.Name);
      return { room: r, type, imgs, facs };
    });

    return enriched.filter(({ room, type }) => {
      const kw = keyword.trim().toLowerCase();
      const matchKw =
        !kw ||
        room.Number.toLowerCase().includes(kw) ||
        room.Name.toLowerCase().includes(kw) ||
        type.Name.toLowerCase().includes(kw);
      const matchStatus = status === "ALL" || room.Status === status;
      const matchType = typeId === "ALL" || type.RoomType_ID === typeId;
      return matchKw && matchStatus && matchType;
    });
  }, [keyword, status, typeId, rooms]);

  const updateRoomStatus = (id: number, s: RoomStatus) => {
    setRooms((arr) => arr.map((r) => (r.Room_ID === id ? { ...r, Status: s } : r)));
  };

  const openAssignDialog = (r: Room) => {
    setAssignRoom(r);
    setAssignMode("reserve");
    setGuestName("");
    setCi("");
    setCo("");
    setSellPrice(r.Price);
    setAssignOpen(true);
  };

  const confirmAssign = () => {
    if (!assignRoom) return;
    // UI only: cập nhật trạng thái
    updateRoomStatus(assignRoom.Room_ID, assignMode === "reserve" ? "Reserved" : "Occupied");
    setAssignOpen(false);
    setSnack({
      open: true,
      msg:
        assignMode === "reserve"
          ? `Đã giữ chỗ phòng ${assignRoom.Number} cho ${guestName || "khách"}`
          : `Đã check-in phòng ${assignRoom.Number} cho ${guestName || "khách"}`,
      severity: "success",
    });
  };

  const onReservedAction = (r: Room) => setReservedDlg(r);
  const onOccupiedAction = (r: Room) => setOccupiedDlg(r);

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h5" fontWeight={800} sx={{ color: "#b8192b" }}>
          Rooms
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" color="inherit" startIcon={<Build />}>
            Bulk Actions
          </Button>
          <Button variant="contained" sx={{ backgroundColor: "#b8192b" }}>
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
                  "Out of Order",
                  "Closed",
                ] as RoomStatus[]
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
                  setTypeId((e.target.value as number) || "ALL")
                }
              >
                <MenuItem value={"ALL" as any}>Tất cả</MenuItem>
                {ROOM_TYPES.map((t) => (
                  <MenuItem key={t.RoomType_ID} value={t.RoomType_ID}>
                    {t.Name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Divider sx={{ my: 1.5 }} />

          {/* Legend */}
          <Stack direction="row" gap={1} flexWrap="wrap">
            {(Object.keys(STATUS_META) as RoomStatus[]).map((k) => (
              <Chip
                key={k}
                size="small"
                icon={STATUS_META[k].icon as any}
                color={STATUS_META[k].color}
                label={STATUS_META[k].label}
                variant="outlined"
              />
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Grid */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
        }}
      >
        {data.map(({ room, type, imgs, facs }) => {
          const firstImg = imgs[0]?.URL;
          const meta = STATUS_META[room.Status];

          return (
            <Card
              key={room.Room_ID}
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
                  alt={room.Name}
                  sx={{ objectFit: "cover" }}
                />
              )}

              <CardContent sx={{ flex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                  <MeetingRoom sx={{ color: "#b8192b" }} />
                  <Typography variant="h6" fontWeight={700}>
                    Phòng {room.Number}
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
                  {type.Name}
                </Typography>

                <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <KingBed fontSize="small" />
                    <Typography variant="body2">{type.Number_of_Bed} giường</Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <People fontSize="small" />
                    <Typography variant="body2">{type.Capacity} người</Typography>
                  </Stack>
                </Stack>

                <Typography variant="h6" sx={{ color: "#b8192b", mb: 1 }}>
                  {formatVND(room.Price)}/đêm
                </Typography>

                {/* Facilities (top 3 + more) */}
                <Stack direction="row" gap={0.75} flexWrap="wrap">
                  {ROOM_FACILITIES.filter((f) => f.Room_ID === room.Room_ID)
                    .slice(0, 3)
                    .map((f) => (
                      <Chip key={f.Room_Facility_ID} size="small" label={f.Name} variant="outlined" />
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
                    onClick={() => navigate(`/staff/rooms/${room.Room_ID}`)}
                  >
                    Chi tiết
                  </Button>

                  {room.Status === "Available" ? (
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      fullWidth
                      onClick={() => openAssignDialog(room)}
                    >
                      Đặt / Gán
                    </Button>
                  ) : room.Status === "Reserved" ? (
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
                  ) : room.Status === "Occupied" ? (
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
        <DialogTitle>Đặt / Gán phòng {assignRoom?.Number}</DialogTitle>
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
        <DialogTitle>Phòng {reservedDlg?.Number} đang giữ chỗ</DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Bạn muốn làm gì tiếp theo?
          </Alert>
          <Stack spacing={1}>
            <Button
              variant="contained"
              onClick={() => {
                setReservedDlg(null);
                navigate(`/staff/check-in?room=${reservedDlg?.Number}`);
              }}
            >
              Đi tới Check-in
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => {
                if (reservedDlg) updateRoomStatus(reservedDlg.Room_ID, "Available");
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
        <DialogTitle>Phòng {occupiedDlg?.Number} đang lưu trú</DialogTitle>
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
                navigate(`/staff/check-out?room=${occupiedDlg?.Number}`);
              }}
            >
              Đi tới Check-out
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => {
                if (occupiedDlg) updateRoomStatus(occupiedDlg.Room_ID, "Available");
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
            if (menuRoom) updateRoomStatus(menuRoom.Room_ID, "Under Maintenance");
            setMenuAnchor(null);
            setMenuRoom(null);
            setSnack({ open: true, msg: "Đã đánh dấu Bảo trì.", severity: "info" });
          }}
        >
          Bảo trì
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuRoom) updateRoomStatus(menuRoom.Room_ID, "Out of Order");
            setMenuAnchor(null);
            setMenuRoom(null);
            setSnack({ open: true, msg: "Đã đánh dấu OOO (Hỏng).", severity: "warning" });
          }}
        >
          Out of Order
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuRoom) updateRoomStatus(menuRoom.Room_ID, "Available");
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
