import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  Divider,
  Chip,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  RadioGroup,
  Radio,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert,
  Avatar,
  Slider,
} from "@mui/material";
import { useLocation } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import NoteAltIcon from "@mui/icons-material/NoteAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import TagFacesIcon from "@mui/icons-material/TagFaces";
import BadgeIcon from "@mui/icons-material/Badge";
import LockIcon from "@mui/icons-material/Lock";

/* =======================
   UTIL
   ======================= */
const formatVND = (n: number) =>
  (Number.isFinite(n) ? n : 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

/* =======================
   MOCK DATA (bookings)
   ======================= */

type RoomType = "Standard" | "Deluxe" | "Suite";

type Booking = {
  code: string;
  guestName: string;
  phone: string;
  email: string;
  roomType: RoomType;
  roomNumber: string; // phòng KH đã chọn trên web
  adults: number;
  children: number;
  checkIn: string; // ISO date
  checkOut: string; // ISO date
  pricePerNight: number; // VND
  source: "Direct" | "OTA" | "Corporate";
  note?: string;
};

const MOCK_BOOKINGS: Booking[] = [
  {
    code: "STAY001",
    guestName: "Nguyen A",
    phone: "0900000001",
    email: "a@example.com",
    roomType: "Deluxe",
    roomNumber: "507",
    adults: 2,
    children: 0,
    checkIn: "2025-10-18",
    checkOut: "2025-10-20",
    pricePerNight: 2800000, // 2.800.000₫/đêm
    source: "Direct",
    note: "Yêu cầu tầng cao, không hút thuốc.",
  },
  {
    code: "STAY002",
    guestName: "Tran B",
    phone: "0900000002",
    email: "b@example.com",
    roomType: "Standard",
    roomNumber: "202",
    adults: 1,
    children: 0,
    checkIn: "2025-10-18",
    checkOut: "2025-10-19",
    pricePerNight: 1200000, // 1.200.000₫/đêm
    source: "OTA",
  },
];

const MOCK_FREE_ROOMS: Record<RoomType, string[]> = {
  Standard: ["201", "202", "208", "210"],
  Deluxe: ["502", "507", "510"],
  Suite: ["801", "803"],
};

/* =======================
   STEPS (bỏ bước Cọc/Prepayment)
   ======================= */

const manualSteps = [
  { key: "lookup", label: "Tra cứu" },
  { key: "id", label: "Nhập giấy tờ" },
  { key: "extras", label: "Ngoại lệ & ghi chú" }, // nâng hạng + cọc thêm (optional)
  { key: "assign", label: "Gán phòng & phát key" }, // đổi phòng nếu nâng hạng
  { key: "review", label: "Xác nhận" },
] as const;

const faceSteps = [
  { key: "lookup", label: "Tra cứu" },
  { key: "face", label: "Quét khuôn mặt" },
  { key: "extras", label: "Ngoại lệ & ghi chú" },
  { key: "assign", label: "Gán phòng & phát key" },
  { key: "review", label: "Xác nhận" },
] as const;

/* =======================
   MAIN COMPONENT
   ======================= */

export default function CheckIn() {
  // Nhận data từ navigation state (từ StaffBookings)
  const location = useLocation();
  const passedBookingData = location.state?.bookingData as Booking | undefined;

  // 0 = Manual, 1 = Face
  const [tab, setTab] = useState<0 | 1>(0);
  const steps = tab === 0 ? manualSteps : faceSteps;

  const [activeStep, setActiveStep] = useState(0);

  /** --------- STEP 1: Lookup --------- */
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Booking | null>(null);

  // Auto-select booking nếu được truyền từ StaffBookings
  useEffect(() => {
    if (passedBookingData) {
      setSelected(passedBookingData);
      setQuery(passedBookingData.code);
      // Tự động chuyển sang bước tiếp theo
      setActiveStep(1);
    }
  }, [passedBookingData]);

  const results = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return MOCK_BOOKINGS.filter(
      (b) =>
        b.code.toLowerCase().includes(q) ||
        b.guestName.toLowerCase().includes(q) ||
        b.phone.includes(q)
    );
  }, [query]);

  /** --------- MANUAL VERIFY --------- */
  const [idNumber, setIdNumber] = useState("");
  const [idName, setIdName] = useState("");
  const [idAddress, setIdAddress] = useState("");
  const [idImages, setIdImages] = useState<File[]>([]);

  /** --------- FACE VERIFY (UI ONLY) --------- */
  const [faceScore, setFaceScore] = useState<number | null>(null); // 0..100
  const MATCH_THRESHOLD = 80;
  const faceOK = (faceScore ?? 0) >= MATCH_THRESHOLD;

  /** --------- EXTRAS (nâng hạng & cọc thêm optional) --------- */
  const [earlyCheckin, setEarlyCheckin] = useState(false);
  const [upgrade, setUpgrade] = useState<"none" | "Deluxe" | "Suite">("none");
  const [addAdult, setAddAdult] = useState(0);
  const [extraBed, setExtraBed] = useState(false);
  const [overbooking, setOverbooking] = useState(false);
  const [internalNote, setInternalNote] = useState("");
  const [extraDeposit, setExtraDeposit] = useState<number>(0); // VND, chỉ hiện khi upgrade != none

  /** --------- ASSIGN --------- */
  // roomSelected mặc định = phòng KH đã chọn trên web
  const [roomSelected, setRoomSelected] = useState<string>("");

  useEffect(() => {
    setRoomSelected(selected?.roomNumber || "");
  }, [selected]);

  const [keyMethod, setKeyMethod] = useState<"card" | "pin" | "qr">("card");
  const [openRoomPicker, setOpenRoomPicker] = useState(false);
  const [openKeyDialog, setOpenKeyDialog] = useState(false);

  /** --------- SUMMARY HELPERS --------- */
  const totalNights = useMemo(() => {
    if (!selected) return 0;
    const a = new Date(selected.checkIn);
    const b = new Date(selected.checkOut);
    return Math.max(1, Math.round((+b - +a) / (1000 * 60 * 60 * 24)));
  }, [selected]);

  const totalRoom = useMemo(() => {
    if (!selected) return 0;
    return selected.pricePerNight * totalNights;
  }, [selected, totalNights]);

  /** --------- TARGET ROOM TYPE & VALIDATION --------- */
  const targetRoomType: RoomType | null = useMemo(() => {
    if (!selected) return null;
    return upgrade === "none" ? selected.roomType : (upgrade as RoomType);
  }, [selected, upgrade]);

  const isRoomValidForTarget = useMemo(() => {
    if (!selected || !roomSelected || !targetRoomType) return false;
    if (upgrade === "none") {
      // không nâng hạng → giữ phòng đã chọn trên web (đã set vào roomSelected)
      return !!roomSelected;
    }
    // nâng hạng → phòng phải thuộc hạng mới
    return MOCK_FREE_ROOMS[targetRoomType].includes(roomSelected);
  }, [selected, roomSelected, targetRoomType, upgrade]);

  /** --------- FLOW GUARDS --------- */
  const canNext = useMemo(() => {
    if (activeStep === 0) return !!selected; // lookup ok
    if (tab === 0) {
      // Manual
      if (activeStep === 1) return idNumber.trim().length >= 6 && idName.trim().length >= 2; // nhập giấy tờ
      if (activeStep === 2) return true; // ngoại lệ & ghi chú
      if (activeStep === 3) return isRoomValidForTarget; // gán phòng & key
      return true;
    } else {
      // Face
      if (activeStep === 1) return faceOK; // face verify
      if (activeStep === 2) return true; // ngoại lệ & ghi chú
      if (activeStep === 3) return isRoomValidForTarget; // gán phòng & key
      return true;
    }
  }, [activeStep, tab, idNumber, idName, faceOK, isRoomValidForTarget]);

  const handleNext = () => setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const resetAll = () => {
    setActiveStep(0);
    setQuery("");
    setSelected(null);
    setIdNumber("");
    setIdName("");
    setIdAddress("");
    setIdImages([]);
    setFaceScore(null);
    setEarlyCheckin(false);
    setUpgrade("none");
    setAddAdult(0);
    setExtraBed(false);
    setOverbooking(false);
    setInternalNote("");
    setExtraDeposit(0);
    setRoomSelected("");
    setKeyMethod("card");
  };

  // Reset phòng khi thay đổi nâng hạng (bắt buộc chọn lại khi upgrade)
  const handleUpgradeChange = (v: "none" | "Deluxe" | "Suite") => {
    setUpgrade(v);
    setExtraDeposit(0);
    if (v === "none") {
      setRoomSelected(selected?.roomNumber || "");
    } else {
      setRoomSelected(""); // xoá để bắt chọn phòng mới
    }
  };

  // Tự bật dialog chọn phòng khi vào bước Assign mà đang nâng hạng & chưa chọn phòng
  useEffect(() => {
    const isAssignStep = (tab === 0 && activeStep === 3) || (tab === 1 && activeStep === 3);
    if (isAssignStep && upgrade !== "none" && !roomSelected) {
      setOpenRoomPicker(true);
    }
  }, [activeStep, tab, upgrade, roomSelected]);

  const BlockHeader = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) => (
    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
      <Avatar sx={{ width: 28, height: 28 }}>{icon}</Avatar>
      <Box>
        <Typography variant="h6">{title}</Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
  );

  const canChangeRoom = upgrade !== "none";
  const defaultRoomNumber = selected?.roomNumber || "";

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} mb={1}>
        Check-in
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={1}>
        Đặt qua web đã thanh toán/cọc. Staff có thể <b>bỏ qua cọc</b>; chỉ thu <b>cọc thêm</b> nếu <b>nâng hạng phòng</b>. Phòng đã được KH chọn sẵn, chỉ thay đổi khi nâng hạng.
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => {
          setTab(v);
          setActiveStep(0);
        }}
        sx={{ mb: 1 }}
      >
        <Tab icon={<BadgeIcon />} iconPosition="start" label="Manual check-in" />
        <Tab icon={<TagFacesIcon />} iconPosition="start" label="Face recognize check-in" />
      </Tabs>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 2 }}>
        {steps.map((s) => (
          <Step key={s.key}>
            <StepLabel>{s.label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* STEP CONTENT */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
          gap: 2,
        }}
      >
        {/* LEFT */}
        <Box>
          {/* STEP 1: LOOKUP */}
          {activeStep === 0 && (
            <Card>
              <CardContent>
                <BlockHeader icon={<SearchIcon fontSize="small" />} title="Tra cứu booking" subtitle="Nhập mã / quét QR / tìm theo SĐT hoặc tên khách" />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <TextField fullWidth label="Mã booking / QR / SĐT / Tên" value={query} onChange={(e) => setQuery(e.target.value)} />
                  <Button variant="contained">Tìm</Button>
                </Stack>

                <Table size="small" sx={{ mt: 2 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Mã</TableCell>
                      <TableCell>Khách</TableCell>
                      <TableCell>Hạng</TableCell>
                      <TableCell>Phòng</TableCell>
                      <TableCell>CI</TableCell>
                      <TableCell>CO</TableCell>
                      <TableCell>Giá/đêm</TableCell>
                      <TableCell align="right">Chọn</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((b) => (
                      <TableRow key={b.code} hover selected={selected?.code === b.code}>
                        <TableCell>{b.code}</TableCell>
                        <TableCell>{b.guestName}</TableCell>
                        <TableCell>{b.roomType}</TableCell>
                        <TableCell>{b.roomNumber}</TableCell>
                        <TableCell>{b.checkIn}</TableCell>
                        <TableCell>{b.checkOut}</TableCell>
                        <TableCell>{formatVND(b.pricePerNight)}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={() => setSelected(b)}
                            variant={selected?.code === b.code ? "contained" : "outlined"}
                          >
                            Chọn
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!query && (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <Typography variant="body2" color="text.secondary">
                            Nhập từ khóa để tìm.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {query && results.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <Alert severity="warning">Không tìm thấy booking.</Alert>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* MANUAL: Nhập giấy tờ */}
          {tab === 0 && activeStep === 1 && (
            <Card>
              <CardContent>
                <BlockHeader icon={<FactCheckIcon fontSize="small" />} title="Nhập thông tin giấy tờ" />
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                  <TextField fullWidth label="Số CCCD/Hộ chiếu" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
                  <TextField fullWidth label="Họ tên theo giấy tờ" value={idName} onChange={(e) => setIdName(e.target.value)} />
                  <Box sx={{ gridColumn: "1 / -1" }}>
                    <TextField fullWidth label="Địa chỉ" value={idAddress} onChange={(e) => setIdAddress(e.target.value)} />
                  </Box>
                  <Box sx={{ gridColumn: "1 / -1" }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Button startIcon={<UploadFileIcon />} component="label">
                        Tải ảnh giấy tờ
                        <input
                          hidden
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => setIdImages(Array.from(e.target.files || []))}
                        />
                      </Button>
                      {!!idImages.length && <Chip label={`${idImages.length} file`} />}
                    </Stack>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* FACE: Quét khuôn mặt (UI-only) */}
          {tab === 1 && activeStep === 1 && (
            <Card>
              <CardContent>
                <BlockHeader
                  icon={<TagFacesIcon fontSize="small" />}
                  title="Quét & nhận diện khuôn mặt (UI demo)"
                  subtitle="Dùng camera thiết bị + mô phỏng kết quả nhận diện"
                />
                {!selected && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Vui lòng chọn booking ở bước 1 trước khi quét.
                  </Alert>
                )}

                <FaceVerifyUI
                  matchThreshold={MATCH_THRESHOLD}
                  onResult={(percent) => setFaceScore(percent)}
                />

                {faceScore !== null && faceScore < MATCH_THRESHOLD && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Điểm khớp chưa đạt ngưỡng. Bạn có thể quét lại hoặc chuyển sang Manual check-in.
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* EXTRAS: nâng hạng + cọc thêm (optional) */}
          {((tab === 0 && activeStep === 2) || (tab === 1 && activeStep === 2)) && (
            <Card>
              <CardContent>
                <BlockHeader icon={<NoteAltIcon fontSize="small" />} title="Ngoại lệ & ghi chú" />
                <Alert severity="info" sx={{ mb: 2 }}>
                  Đặt qua web đã thanh toán/cọc. <b>Không cần cọc thêm</b> trừ khi <b>nâng hạng phòng</b>.
                </Alert>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                  <Box>
                    <FormControlLabel control={<Checkbox checked={earlyCheckin} onChange={(e) => setEarlyCheckin(e.target.checked)} />} label="Early check-in (có phụ phí)" />
                    <FormControlLabel control={<Checkbox checked={extraBed} onChange={(e) => setExtraBed(e.target.checked)} />} label="Thêm giường phụ" />
                    <FormControlLabel control={<Checkbox checked={overbooking} onChange={(e) => setOverbooking(e.target.checked)} />} label="Overbooking — cần phê duyệt" />
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="body2">Thêm người lớn:</Typography>
                      <TextField type="number" size="small" value={addAdult} onChange={(e) => setAddAdult(Number(e.target.value))} sx={{ width: 120 }} />
                    </Stack>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={600} gutterBottom>Nâng hạng phòng</Typography>
                    <RadioGroup
                      value={upgrade}
                      onChange={(e) => handleUpgradeChange(e.target.value as "none" | "Deluxe" | "Suite")}
                    >
                      <FormControlLabel value="none" control={<Radio />} label="Không" />
                      <FormControlLabel value="Deluxe" control={<Radio />} label="Deluxe" />
                      <FormControlLabel value="Suite" control={<Radio />} label="Suite" />
                    </RadioGroup>

                    {upgrade !== "none" && (
                      <Box sx={{ mt: 1 }}>
                        <TextField
                          label="Cọc thêm (VND, tùy chính sách)"
                          type="number"
                          fullWidth
                          value={extraDeposit}
                          onChange={(e) => setExtraDeposit(Number(e.target.value))}
                          helperText="Nhập nếu khách sạn yêu cầu khi nâng hạng phòng"
                        />
                      </Box>
                    )}

                    <TextField
                      label="Ghi chú nội bộ"
                      multiline
                      minRows={3}
                      fullWidth
                      sx={{ mt: 2 }}
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* ASSIGN room & key */}
          {((tab === 0 && activeStep === 3) || (tab === 1 && activeStep === 3)) && (
            <Card>
              <CardContent>
                <BlockHeader
                  icon={<MeetingRoomIcon fontSize="small" />}
                  title="Gán phòng & phát key"
                  subtitle={
                    canChangeRoom
                      ? "Đang nâng hạng — chọn phòng mới theo hạng đã chọn"
                      : "Phòng đã được khách chọn sẵn trên web (không đổi)"
                  }
                />

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="center">
                  <TextField
                    label={canChangeRoom ? "Phòng (chọn phòng mới)" : "Phòng (khóa theo đặt trước)"}
                    value={roomSelected}
                    onClick={() => canChangeRoom && setOpenRoomPicker(true)}
                    placeholder={canChangeRoom ? "Nhấn để chọn phòng" : ""}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                  {!canChangeRoom && <Chip icon={<LockIcon />} label="Locked" variant="outlined" />}

                  <FormControl fullWidth>
                    <InputLabel>Phương thức key</InputLabel>
                    <Select label="Phương thức key" value={keyMethod} onChange={(e) => setKeyMethod(e.target.value as any)}>
                      <MenuItem value="card">Thẻ từ</MenuItem>
                      <MenuItem value="pin">Mã PIN</MenuItem>
                      <MenuItem value="qr">QR code</MenuItem>
                    </Select>
                  </FormControl>
                  <Button variant="outlined" startIcon={<VpnKeyIcon />} onClick={() => setOpenKeyDialog(true)} disabled={!roomSelected}>
                    Phát key
                  </Button>
                </Stack>

                <Alert icon={<WarningAmberIcon />} severity="warning" sx={{ mt: 2 }}>
                  Kiểm tra tình trạng phòng (Clean/Dirty/OOO) trước khi gán.
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* REVIEW */}
          {((tab === 0 && activeStep === 4) || (tab === 1 && activeStep === 4)) && (
            <Card>
              <CardContent>
                <BlockHeader icon={<CheckCircleIcon fontSize="small" />} title="Xác nhận check-in" />
                {selected ? (
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>Khách & booking</Typography>
                        <Stack spacing={0.5}>
                          <Row label="Mã booking" value={selected.code} />
                          <Row label="Khách" value={selected.guestName} />
                          <Row label="SĐT" value={selected.phone} />
                          <Row label="Email" value={selected.email} />
                          <Row label="Hạng ban đầu" value={selected.roomType} />
                          <Row label="Phòng (theo web)" value={defaultRoomNumber} />
                          <Row label="Số đêm" value={`${totalNights}`} />
                          <Row label="Giá/đêm" value={formatVND(selected.pricePerNight)} />
                          <Row label="Nguồn" value={selected.source} />
                        </Stack>
                      </CardContent>
                    </Card>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>Nhận phòng</Typography>
                        <Stack spacing={0.5}>
                          <Row label="Nâng hạng" value={upgrade === "none" ? "Không" : upgrade} />
                          <Row label="Phòng thực tế" value={roomSelected || "—"} />
                          <Row label="Key" value={keyMethod.toUpperCase()} />
                          {upgrade !== "none" && <Row label="Cọc thêm" value={formatVND(Number.isFinite(extraDeposit) ? extraDeposit : 0)} />}
                          {tab === 1 && <Row label="Face match" value={faceScore !== null ? `${faceScore}%` : "—"} />}
                          <Row label="Early CI" value={earlyCheckin ? "Yes" : "No"} />
                          <Row label="Extra bed" value={extraBed ? "Yes" : "No"} />
                          <Row label="Thêm người lớn" value={`${addAdult}`} />
                          {internalNote && <Row label="Ghi chú" value={internalNote} />}
                        </Stack>
                      </CardContent>
                    </Card>
                    <Box sx={{ gridColumn: "1 / -1" }}>
                      <Alert severity="info">Đặt qua web đã thanh toán/cọc. Chỉ hiển thị “Cọc thêm” nếu nâng hạng.</Alert>
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="warning">Vui lòng chọn booking ở bước 1.</Alert>
                )}
              </CardContent>
            </Card>
          )}
        </Box>

        {/* RIGHT: summary (sticky) */}
        <Box>
          <Card sx={{ position: { md: "sticky" }, top: { md: 84 } }}>
            <CardContent>
              <BlockHeader icon={<PersonSearchIcon fontSize="small" />} title="Tóm tắt booking" />
              {selected ? (
                <Stack spacing={0.75}>
                  <Row label="Mã" value={selected.code} />
                  <Row label="Khách" value={selected.guestName} />
                  <Row label="Hạng ban đầu" value={selected.roomType} />
                  <Row label="Phòng (web)" value={selected.roomNumber} />
                  <Row label="Khách (A/C)" value={`${selected.adults}/${selected.children}`} />
                  <Row label="Check-in" value={selected.checkIn} />
                  <Row label="Check-out" value={selected.checkOut} />
                  <Row label="Số đêm" value={`${totalNights}`} />
                  <Row label="Giá/đêm" value={formatVND(selected.pricePerNight)} />
                  <Row label="Nguồn" value={selected.source} />
                  {selected.note && <Row label="Ghi chú" value={selected.note} />}
                  <Divider sx={{ my: 1 }} />
                  <Row label="Tổng tiền phòng" value={formatVND(totalRoom)} />
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">Chưa chọn booking.</Typography>
              )}

              <Divider sx={{ my: 2 }} />

              <Stack direction="row" spacing={1} justifyContent="space-between">
                <Button disabled={activeStep === 0} onClick={handleBack}>Quay lại</Button>
                {activeStep < steps.length - 1 ? (
                  <Button variant="contained" disabled={!canNext} onClick={handleNext}>Tiếp tục</Button>
                ) : (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    disabled={!selected || !roomSelected || (tab === 1 && !faceOK)}
                    onClick={() => {
                      // UI-only: reset sau khi confirm
                      resetAll();
                    }}
                  >
                    Xác nhận Check-in
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Dialog chọn phòng (chỉ bật nếu upgrade != none) */}
      <Dialog open={openRoomPicker} onClose={() => setOpenRoomPicker(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Chọn phòng trống ({targetRoomType || "—"})</DialogTitle>
        <DialogContent dividers>
          {selected ? (
            upgrade === "none" ? (
              <Alert severity="info">Không thể đổi phòng khi không nâng hạng.</Alert>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
                {MOCK_FREE_ROOMS[targetRoomType || selected.roomType].map((r) => (
                  <Button key={r} variant={roomSelected === r ? "contained" : "outlined"} fullWidth onClick={() => setRoomSelected(r)}>
                    {r}
                  </Button>
                ))}
              </Box>
            )
          ) : (
            <Alert severity="warning">Chọn booking trước.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRoomPicker(false)}>Đóng</Button>
          <Button variant="contained" disabled={!roomSelected} onClick={() => setOpenRoomPicker(false)}>Xong</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog phát key */}
      <Dialog open={openKeyDialog} onClose={() => setOpenKeyDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Phát key phòng</DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            (UI demo) Giả lập encoder / sinh PIN / tạo QR cho phòng {roomSelected || "—"}.
          </Alert>
          <FormControl fullWidth>
            <InputLabel>Phương thức</InputLabel>
            <Select label="Phương thức" value={keyMethod} onChange={(e) => setKeyMethod(e.target.value as any)}>
              <MenuItem value="card">Thẻ từ</MenuItem>
              <MenuItem value="pin">Mã PIN</MenuItem>
              <MenuItem value="qr">QR code</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ mt: 2 }}>
            {keyMethod === "pin" && <TextField fullWidth label="PIN (auto-generated)" defaultValue="843219" />}
            {keyMethod === "qr" && (
              <Box sx={{ p: 2, border: "1px dashed #ddd", borderRadius: 1, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">QR preview (mock)</Typography>
                <Box sx={{ height: 120, bgcolor: "#eee", mt: 1 }} />
              </Box>
            )}
            {keyMethod === "card" && <Typography variant="body2" color="text.secondary">Đưa thẻ vào encoder… (mock)</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenKeyDialog(false)}>Đóng</Button>
          <Button variant="contained" onClick={() => setOpenKeyDialog(false)}>Phát key</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/* =======================
   Row helper
   ======================= */
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={600} textAlign="right" sx={{ ml: 2 }}>
        {value}
      </Typography>
    </Stack>
  );
}

/* =======================
   FaceVerifyUI (UI-only, camera + mock score)
   ======================= */
function FaceVerifyUI({
  matchThreshold = 80,
  onResult,
}: {
  matchThreshold?: number;
  onResult?: (percent: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreaming(true);
      }
    } catch (e) {
      console.error(e);
      setErr("Không truy cập được camera – hãy cấp quyền máy ảnh cho trình duyệt.");
    }
  };

  const stopCamera = () => {
    const v = videoRef.current;
    const stream = v?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (v) v.srcObject = null;
    setStreaming(false);
  };

  // mô phỏng quét ra điểm
  const simulate = (type: "match" | "mismatch") => {
    const val =
      type === "match" ? Math.floor(85 + Math.random() * 15) : Math.floor(40 + Math.random() * 35);
    setScore(val);
    onResult?.(val);
  };

  // chỉnh tay cho demo (slider)
  const setManual = (_: Event, v: number | number[]) => {
    const val = Array.isArray(v) ? v[0] : v;
    setScore(val);
    onResult?.(val);
  };

  useEffect(() => {
    return () => {
      // cleanup camera khi unmount
      stopCamera();
    };
  }, []);

  return (
    <Box>
      {err && <Alert severity="error" sx={{ mb: 1 }}>{err}</Alert>}

      <Box sx={{ position: "relative", borderRadius: 1, overflow: "hidden", bgcolor: "#000" }}>
        <video ref={videoRef} playsInline muted style={{ width: "100%", height: 300, objectFit: "cover" }} />
        {!streaming && (
          <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#fff", bgcolor: "rgba(0,0,0,.25)" }}>
            <Typography>Camera preview</Typography>
          </Box>
        )}
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} mt={2} alignItems="center">
        {!streaming ? (
          <Button variant="contained" onClick={startCamera}>Bật camera</Button>
        ) : (
          <Button variant="outlined" onClick={stopCamera}>Tắt camera</Button>
        )}
        <Button onClick={() => simulate("match")} disabled={!streaming}>Scan (match)</Button>
        <Button onClick={() => simulate("mismatch")} disabled={!streaming}>Scan (mismatch)</Button>
        <Chip
          label={score == null ? "Chưa quét" : `Match ${score}%`}
          color={score != null ? (score >= matchThreshold ? "success" : "warning") : "default"}
          variant="outlined"
        />
      </Stack>

      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">Chỉnh tay điểm match (demo):</Typography>
        <Slider value={score ?? 0} onChange={setManual} min={0} max={100} sx={{ maxWidth: 360 }} />
        <Typography variant="caption" color="text.secondary">Ngưỡng đậu: {matchThreshold}%</Typography>
      </Box>
    </Box>
  );
}
