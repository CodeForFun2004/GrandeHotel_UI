import React, { useMemo, useState, useEffect } from "react";
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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SearchIcon from "@mui/icons-material/Search";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import NoteAltIcon from "@mui/icons-material/NoteAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TagFacesIcon from "@mui/icons-material/TagFaces";
import BadgeIcon from "@mui/icons-material/Badge";
import LockIcon from "@mui/icons-material/Lock";
import {
  searchReservationsForCheckIn as apiSearchCheckin,
  confirmCheckIn as apiConfirmCheckin,
  getReservationForCheckIn as apiGetReservationForCheckIn,
  type CheckinSearchItem,
} from "../../api/dashboard";
import { cancelReservation as apiCancelReservation } from "../../api/reservations";
import type { IdType } from "./components/checkin";
import {
  formatVND,
  validateIdDoc,
  sanitizeIdNumber,
  ManualCheckInFlow,
  FaceRecognizeCheckInFlow,
  MATCH_THRESHOLD,
  BlockHeader,
} from "./components/checkin";

import FaceVerifyUI from "./FaceVerifyUI";

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
  const navigate = useNavigate();
  // Legacy navigation state removed; use API search

  // 0 = Manual, 1 = Face
  const [tab, setTab] = useState<0 | 1>(0);
  const steps = tab === 0 ? manualSteps : faceSteps;

  const [activeStep, setActiveStep] = useState(0);

  /** --------- STEP 1: Lookup --------- */
  const [query, setQuery] = useState("");
  const [checkInDate, setCheckInDate] = useState<string>(""); // yyyy-MM-dd
  const [todayOnly, setTodayOnly] = useState<boolean>(false);
  const [selected, setSelected] = useState<CheckinSearchItem | null>(null);
  // room selections by roomTypeId -> rooms
  const [selectedRoomsByType, setSelectedRoomsByType] = useState<
    Record<string, Array<{ _id: string; roomNumber?: string; name?: string }>>
  >({});
  // room type names for display
  const [roomTypeNames, setRoomTypeNames] = useState<Record<string, string>>(
    {}
  );
  // available rooms to choose per roomType
  const [availableRoomsByType, setAvailableRoomsByType] = useState<
    Record<
      string,
      Array<{
        _id: string;
        roomNumber?: string;
        name?: string;
        status?: string;
      }>
    >
  >({});
  // payment summary for selected reservation
  const [paymentSummary, setPaymentSummary] = useState<{
    paymentStatus: "unpaid" | "partially_paid" | "deposit_paid" | "fully_paid";
    depositAmount: number;
    totalPrice: number;
    paidAmount: number;
  } | null>(null);
  // per-room ID docs: roomId -> { type, number, nameOnId, address? }
  const [idDocs, setIdDocs] = useState<
    Record<
      string,
      { type?: IdType; number: string; nameOnId: string; address?: string }
    >
  >({});
  // Track verification status for manual check-in
  const [verifiedRooms, setVerifiedRooms] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<CheckinSearchItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Cancel dialog state
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState<string>("");

  // Auto-select booking nếu được truyền từ StaffBookings
  useEffect(() => {
    // no-op: legacy navigation state removed; rely on search
  }, []);

  const doSearch = async () => {
    setErrorMsg(null);
    try {
      setSearching(true);
      const res = await apiSearchCheckin(query.trim(), {
        checkInDate: checkInDate || undefined,
        todayOnly,
      });
      setResults(res.results || []);
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.message || "Tìm kiếm thất bại");
    } finally {
      setSearching(false);
    }
  };
  // load reservation detail and default room selections
  const loadReservationDetail = async (reservationId: string) => {
    try {
      const detail = await apiGetReservationForCheckIn(reservationId);
      // store payment summary if provided
      setPaymentSummary(detail.payment ?? null);
      const map: Record<
        string,
        Array<{ _id: string; roomNumber?: string; name?: string }>
      > = {};
      const avail: Record<
        string,
        Array<{
          _id: string;
          roomNumber?: string;
          name?: string;
          status?: string;
        }>
      > = {};
      const typeNames: Record<string, string> = {};
      for (const d of detail.details) {
        const rtId = (d.roomType as any)._id || d.roomType; // supports populated or id
        const rtName =
          (d.roomType as any).name || (d.roomType as any).title || "Loại phòng";
        typeNames[String(rtId)] = String(rtName);
        const qty = d.quantity;
        const reserved = Array.isArray(d.reservedRooms) ? d.reservedRooms : [];
        let picked = reserved.slice(0, qty);
        const sug = detail.suggestions.find(
          (s) => String((s.roomType as any)._id || s.roomType) === String(rtId)
        );
        if (picked.length < qty) {
          const add = (sug?.suggestedRooms || [])
            .filter((r) => !picked.some((p) => String(p._id) === String(r._id)))
            .slice(0, qty - picked.length);
          picked = [...picked, ...add];
        }
        // Always store full available options for this room type to allow reassignment
        avail[String(rtId)] = (sug?.suggestedRooms || []).map((r) => ({
          _id: String(r._id),
          roomNumber: r.roomNumber,
          name: r.name,
          status: (r as any).status,
        }));
        map[String(rtId)] = picked.map((r) => ({
          _id: String(r._id),
          roomNumber: r.roomNumber,
          name: r.name,
        }));
      }
      setSelectedRoomsByType(map);
      setAvailableRoomsByType(avail);
      setRoomTypeNames(typeNames);
      // reset id docs when switching reservation
      setIdDocs({});
    } catch (e) {
      console.error(e);
    }
  };

  const allSelectedRooms = useMemo(
    () => Object.values(selectedRoomsByType).flat(),
    [selectedRoomsByType]
  );
  const setIdDocField = (
    roomId: string,
    field: "number" | "nameOnId" | "address",
    value: string
  ) => {
    setIdDocs((prev) => {
      const current = prev[roomId] || {
        type: "cccd" as IdType,
        number: "",
        nameOnId: "",
      };
      let v = value;
      // sanitize by type
      const t = current.type || "cccd";
      if (field === "number") {
        v = sanitizeIdNumber(t, value);
      }
      return { ...prev, [roomId]: { ...current, [field]: v } };
    });
  };
  const setIdDocType = (roomId: string, type: IdType) => {
    setIdDocs((prev) => {
      const current = prev[roomId] || { number: "", nameOnId: "" };
      // when switching type, re-sanitize number
      const num = sanitizeIdNumber(type, current.number || "");
      return { ...prev, [roomId]: { ...current, type, number: num } };
    });
  };
  // initial load: list all eligible reservations by default
  useEffect(() => {
    void doSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // auto refresh when filters change (except while typing query; explicit search triggers)
  useEffect(() => {
    if (!query.trim()) {
      void doSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkInDate, todayOnly]);

  /** --------- MANUAL VERIFY (per-room handled below) --------- */

  /** --------- FACE VERIFY (UI ONLY) --------- */
  const [faceScore, setFaceScore] = useState<number | null>(null); // 0..100
  const [faceVerified, setFaceVerified] = useState(false); // Track if face was verified via API (success: true)
  const [faceUserData, setFaceUserData] = useState<any>(null); // Store matched user data
  const faceOK = faceVerified; // Chỉ cần API trả về success là được

  /** --------- EXTRAS (nâng hạng & cọc thêm optional) --------- */
  const [earlyCheckin, setEarlyCheckin] = useState(false);
  const [upgrade, setUpgrade] = useState<"none" | "Deluxe" | "Suite">("none");
  const [addAdult, setAddAdult] = useState(0);
  const [extraBed, setExtraBed] = useState(false);
  const [overbooking, setOverbooking] = useState(false);
  const [internalNote, setInternalNote] = useState("");
  const [extraDeposit, setExtraDeposit] = useState<number>(0); // VND, chỉ hiện khi upgrade != none

  /** --------- ASSIGN --------- */
  const [roomSelected, setRoomSelected] = useState<string>("");
  // No default from booking; optional note only

  const [keyMethod, setKeyMethod] = useState<"card" | "pin" | "qr">("card");
  const [openKeyDialog, setOpenKeyDialog] = useState(false);
  // Room reassignment dialog state
  const [roomPickerOpen, setRoomPickerOpen] = useState(false);
  const [roomPickerTypeId, setRoomPickerTypeId] = useState<string | null>(null);
  const [pickerTempIds, setPickerTempIds] = useState<string[]>([]);
  const [pickerError, setPickerError] = useState<string | null>(null);

  const openRoomPicker = (roomTypeId: string) => {
    setRoomPickerTypeId(roomTypeId);
    const current = selectedRoomsByType[roomTypeId] || [];
    setPickerTempIds(current.map((r) => r._id));
    setPickerError(null);
    setRoomPickerOpen(true);
  };
  const closeRoomPicker = () => {
    setRoomPickerOpen(false);
    setRoomPickerTypeId(null);
    setPickerTempIds([]);
    setPickerError(null);
  };
  const togglePickRoom = (roomId: string) => {
    if (!roomPickerTypeId) return;
    const required = (selectedRoomsByType[roomPickerTypeId] || []).length;
    setPickerTempIds((prev) => {
      const exists = prev.includes(roomId);
      if (exists) {
        // unselect if already selected
        const next = prev.filter((id) => id !== roomId);
        setPickerError(null);
        return next;
      }
      if (required <= 0) {
        setPickerError(null);
        return [roomId];
      }
      if (prev.length < required) {
        setPickerError(null);
        return [...prev, roomId];
      }
      // At capacity: replace the last selection with the new one (1-for-1 swap)
      const replaced = [...prev];
      replaced[replaced.length - 1] = roomId;
      setPickerError(null);
      return replaced;
    });
  };
  const applyRoomPicker = () => {
    if (!roomPickerTypeId) return;
    const required = (selectedRoomsByType[roomPickerTypeId] || []).length;
    if (pickerTempIds.length !== required) {
      setPickerError(`Cần chọn đúng ${required} phòng`);
      return;
    }
    // map selected ids to room objects (prefer available list, fallback to old selection map)
    const availList = availableRoomsByType[roomPickerTypeId] || [];
    const oldList = selectedRoomsByType[roomPickerTypeId] || [];
    const newRooms = pickerTempIds.map((id) => {
      const found =
        availList.find((r) => String(r._id) === String(id)) ||
        oldList.find((r) => String(r._id) === String(id));
      return found
        ? {
            _id: String(found._id),
            roomNumber: found.roomNumber,
            name: found.name,
          }
        : ({ _id: String(id) } as any);
    });
    setSelectedRoomsByType((prev) => ({
      ...prev,
      [roomPickerTypeId]: newRooms,
    }));
    // prune id docs for rooms no longer selected
    setIdDocs((prev) => {
      const allowedIds = new Set(
        Object.values({ ...selectedRoomsByType, [roomPickerTypeId]: newRooms })
          .flat()
          .map((r) => r._id)
      );
      const next: typeof prev = {};
      Object.entries(prev).forEach(([rid, doc]) => {
        if (allowedIds.has(rid)) next[rid] = doc;
      });
      return next;
    });
    closeRoomPicker();
  };

  /** --------- SUMMARY HELPERS --------- */
  const totalNights = useMemo(() => {
    if (!selected) return 0;
    const a = new Date(selected.checkInDate);
    const b = new Date(selected.checkOutDate);
    return Math.max(1, Math.round((+b - +a) / (1000 * 60 * 60 * 24)));
  }, [selected]);

  // totals for summary (from payment summary)
  const totalPrice = paymentSummary?.totalPrice ?? 0;
  const depositAmount = paymentSummary?.depositAmount ?? 0;
  const paidAmount = paymentSummary?.paidAmount ?? 0;
  const remainingAmount = Math.max(0, totalPrice - paidAmount);

  /** --------- TARGET ROOM TYPE & VALIDATION --------- */
  // targetRoomType removed in API-driven flow

  const isRoomValidForTarget = true; // backend auto-picks rooms; UI doesn't enforce

  /** --------- FLOW GUARDS --------- */
  const canNext = useMemo(() => {
    if (activeStep === 0) return !!selected; // lookup ok
    if (tab === 0) {
      // Manual
      if (activeStep === 1) {
        // require one valid ID per selected room AND all rooms must be verified
        if (allSelectedRooms.length === 0) return false;
        for (const r of allSelectedRooms) {
          // Must have valid ID doc
          if (!validateIdDoc(idDocs[r._id])) return false;
          // Must be verified via API (for CCCD/CMND only)
          const docType = idDocs[r._id]?.type || "cccd";
          if (docType === "cccd" || docType === "cmnd") {
            if (!verifiedRooms.has(r._id)) return false; // Must be verified
          }
        }
        return true;
      }
      if (activeStep === 2) return true; // ngoại lệ & ghi chú
      if (activeStep === 3) return isRoomValidForTarget; // backend will validate
      return true;
    } else {
      // Face
      if (activeStep === 1) {
        // Chỉ cần API verify thành công (success: true) hoặc score >= 40% (mapped to 80%+)
        return faceVerified;
      }
      if (activeStep === 2) return true; // ngoại lệ & ghi chú
      if (activeStep === 3) return isRoomValidForTarget; // backend will validate
      return true;
    }
  }, [
    activeStep,
    tab,
    faceVerified,
    isRoomValidForTarget,
    allSelectedRooms,
    idDocs,
    verifiedRooms,
  ]);

  const handleNext = () => {
    // Additional validation for manual check-in ID step
    if (tab === 0 && activeStep === 1) {
      const unverifiedRooms = allSelectedRooms.filter((r) => {
        const docType = idDocs[r._id]?.type || "cccd";
        return (
          (docType === "cccd" || docType === "cmnd") &&
          !verifiedRooms.has(r._id)
        );
      });

      if (unverifiedRooms.length > 0) {
        const roomNumbers = unverifiedRooms
          .map((r) => r.roomNumber || r.name || r._id)
          .join(", ");
        toast.error(
          `⚠️ Vui lòng kiểm tra và xác thực giấy tờ cho các phòng: ${roomNumbers}`,
          {
            position: "top-right",
            autoClose: 5000,
          }
        );
        return;
      }
    }

    // Additional validation for face check-in
    if (tab === 1 && activeStep === 1) {
      if (!faceVerified) {
        toast.error(`⚠️ Vui lòng quét khuôn mặt để xác thực thành công`, {
          position: "top-right",
          autoClose: 5000,
        });
        return;
      }
    }

    setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const resetAll = () => {
    setActiveStep(0);
    setQuery("");
    setSelected(null);
    setSelectedRoomsByType({});
    setIdDocs({});
    setVerifiedRooms(new Set());
    setFaceScore(null);
    setFaceVerified(false);
    setFaceUserData(null);
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
    // In API flow, we don't manage room selection here
    setRoomSelected("");
  };

  // Tự bật dialog chọn phòng khi vào bước Assign mà đang nâng hạng & chưa chọn phòng
  useEffect(() => {
    // no-op; backend will handle auto room assignment if needed
  }, [activeStep, tab, upgrade, roomSelected]);

  return (
    <Box>
      <ToastContainer />
      <Typography variant="h5" fontWeight={800} mb={1}>
        Check-in
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={1}>
        Đặt qua web đã thanh toán/cọc. Staff có thể <b>bỏ qua cọc</b>; chỉ thu{" "}
        <b>cọc thêm</b> nếu <b>nâng hạng phòng</b>. Phòng đã được KH chọn sẵn,
        chỉ thay đổi khi nâng hạng.
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => {
          setTab(v);
          setActiveStep(0);
        }}
        sx={{ mb: 1 }}
      >
        <Tab
          icon={<BadgeIcon />}
          iconPosition="start"
          label="Manual check-in"
        />
        <Tab
          icon={<TagFacesIcon />}
          iconPosition="start"
          label="Face recognize check-in"
        />
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
                <BlockHeader
                  icon={<SearchIcon fontSize="small" />}
                  title="Tra cứu booking"
                  subtitle="Tìm hoặc lọc các đặt phòng đủ điều kiện check-in (đã duyệt và đã cọc/đã thanh toán)"
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <TextField
                    fullWidth
                    label="Từ khóa (Tên / Username / SĐT / Mã đặt phòng)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") doSearch();
                    }}
                  />
                  <TextField
                    type="date"
                    label="Ngày check-in"
                    InputLabelProps={{ shrink: true }}
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    sx={{ minWidth: 200 }}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={todayOnly}
                        onChange={(e) => setTodayOnly(e.target.checked)}
                      />
                    }
                    label="Chỉ hôm nay"
                  />
                  <Button
                    variant="contained"
                    onClick={doSearch}
                    disabled={searching}
                  >
                    {searching ? "Đang tìm..." : "Tìm"}
                  </Button>
                </Stack>
                {errorMsg && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {errorMsg}
                  </Alert>
                )}

                <Table size="small" sx={{ mt: 2 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Khách</TableCell>
                      <TableCell>SĐT</TableCell>
                      <TableCell>Khách sạn</TableCell>
                      <TableCell>CI</TableCell>
                      <TableCell>CO</TableCell>
                      <TableCell>Payment</TableCell>
                      <TableCell align="right">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((b) => (
                      <TableRow
                        key={b.id}
                        hover
                        selected={selected?.id === b.id}
                      >
                        <TableCell>{b.customer?.fullname}</TableCell>
                        <TableCell>{b.customer?.phone || "—"}</TableCell>
                        <TableCell>{b.hotel?.name}</TableCell>
                        <TableCell>
                          {new Date(b.checkInDate).toLocaleDateString("vi-VN")}
                        </TableCell>
                        <TableCell>
                          {new Date(b.checkOutDate).toLocaleDateString("vi-VN")}
                        </TableCell>
                        <TableCell>{b.paymentStatus}</TableCell>
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="flex-end"
                          >
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => {
                                setSelected(b);
                                void loadReservationDetail(b.id);
                                setActiveStep(1);
                              }}
                            >
                              Check-in
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => {
                                setCancelingId(b.id);
                                setCancelReason("");
                              }}
                            >
                              Hủy
                            </Button>
                            <Button
                              size="small"
                              onClick={() =>
                                navigate(`/manager/bookings/${b.id}`)
                              }
                            >
                              Chi tiết
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!searching && results.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <Alert severity="warning">
                            Không có đặt phòng phù hợp.
                          </Alert>
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
            <ManualCheckInFlow
              step="id"
              allSelectedRooms={allSelectedRooms}
              idDocs={idDocs}
              onSetIdDocType={setIdDocType}
              onSetIdDocField={setIdDocField}
              verifiedRooms={verifiedRooms}
              onRoomVerified={(roomId) =>
                setVerifiedRooms((prev) => new Set([...prev, roomId]))
              }
              onRoomUnverified={(roomId) =>
                setVerifiedRooms((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(roomId);
                  return newSet;
                })
              }
            />
          )}

          {/* FACE: Quét khuôn mặt (UI-only) */}
          {/* FACE: Quét khuôn mặt */}
          {tab === 1 && activeStep === 1 && (
            <Card>
              <CardContent>
                <BlockHeader
                  icon={<TagFacesIcon fontSize="small" />}
                  title="Quét khuôn mặt"
                  subtitle="Dùng camera để nhận diện khuôn mặt và đối chiếu với khách trên booking"
                />

                {selected ? (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Đang nhận diện cho booking của:{" "}
                      <strong>{selected.customer?.fullname}</strong>{" "}
                      {selected.customer?.email && (
                        <>({selected.customer.email})</>
                      )}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Vui lòng chọn một booking ở bước <b>Tra cứu</b> trước khi
                      quét khuôn mặt.
                    </Typography>
                  </Box>
                )}

                <FaceVerifyUI
                  suppressSuccessToast // tắt toast success của FaceVerifyUI
                  matchThreshold={MATCH_THRESHOLD}
                  onResult={(percent, userData) => {
                    // lưu điểm để show UI ở step review
                    setFaceScore(percent ?? 0);

                    // Nếu FaceVerifyUI đã báo fail (success=false hoặc điểm 0)
                    if (
                      !userData ||
                      userData.success === false ||
                      percent < MATCH_THRESHOLD
                    ) {
                      setFaceVerified(false);
                      setFaceUserData(null);
                      return;
                    }

                    // Chưa chọn booking mà quét mặt
                    if (!selected) {
                      toast.error(
                        "Vui lòng chọn booking ở bước Tra cứu trước khi quét khuôn mặt",
                        {
                          position: "top-right",
                          autoClose: 4000,
                        }
                      );
                      setFaceVerified(false);
                      setFaceUserData(null);
                      setFaceScore(0);
                      return;
                    }

                    // Lấy info từ booking
                    const bookingName = (selected.customer?.fullname || "")
                      .trim()
                      .toLowerCase();
                    const bookingEmail = (selected.customer?.email || "")
                      .trim()
                      .toLowerCase();

                    // Info từ API face
                    const faceName = (userData.fullname || userData.name || "")
                      .trim()
                      .toLowerCase();
                    const faceEmail = (userData.email || "")
                      .trim()
                      .toLowerCase();

                    const nameMatch =
                      bookingName && faceName && bookingName === faceName;
                    const emailMatch =
                      bookingEmail && faceEmail && bookingEmail === faceEmail;

                    // ✅ Hoàn toàn trùng: cho pass
                    if (nameMatch && emailMatch) {
                      setFaceVerified(true);
                      setFaceUserData(userData);

                      toast.success(
                        `🎉 Nhận diện thành công: ${selected.customer?.fullname}`,
                        {
                          position: "top-right",
                          autoClose: 3500,
                        }
                      );
                    } else {
                      // ❌ Match với user khác — không cho pass
                      setFaceVerified(false);
                      setFaceUserData(null);
                      setFaceScore(0);

                      const faceLabel =
                        userData.fullname ||
                        userData.email ||
                        userData.username ||
                        "khách khác";

                      toast.error(
                        `❌ Khuôn mặt khớp với tài khoản ${faceLabel}, nhưng KH booking là ${
                          selected.customer?.fullname
                        } (${
                          selected.customer?.email || "không có email"
                        }). Vui lòng kiểm tra lại.`,
                        {
                          position: "top-right",
                          autoClose: 6000,
                        }
                      );
                    }
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* EXTRAS: nâng hạng + cọc thêm (optional) */}
          {((tab === 0 && activeStep === 2) ||
            (tab === 1 && activeStep === 2)) && (
            <Card>
              <CardContent>
                <BlockHeader
                  icon={<NoteAltIcon fontSize="small" />}
                  title="Ngoại lệ & ghi chú"
                />
                <Alert severity="info" sx={{ mb: 2 }}>
                  Đặt qua web đã thanh toán/cọc. <b>Không cần cọc thêm</b> trừ
                  khi <b>nâng hạng phòng</b>.
                </Alert>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 2,
                  }}
                >
                  <Box>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={earlyCheckin}
                          onChange={(e) => setEarlyCheckin(e.target.checked)}
                        />
                      }
                      label="Early check-in (có phụ phí)"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={extraBed}
                          onChange={(e) => setExtraBed(e.target.checked)}
                        />
                      }
                      label="Thêm giường phụ"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={overbooking}
                          onChange={(e) => setOverbooking(e.target.checked)}
                        />
                      }
                      label="Overbooking — cần phê duyệt"
                    />
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="body2">Thêm người lớn:</Typography>
                      <TextField
                        type="number"
                        size="small"
                        value={addAdult}
                        onChange={(e) => setAddAdult(Number(e.target.value))}
                        sx={{ width: 120 }}
                      />
                    </Stack>
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Nâng hạng phòng
                    </Typography>
                    <RadioGroup
                      value={upgrade}
                      onChange={(e) =>
                        handleUpgradeChange(
                          e.target.value as "none" | "Deluxe" | "Suite"
                        )
                      }
                    >
                      <FormControlLabel
                        value="none"
                        control={<Radio />}
                        label="Không"
                      />
                      <FormControlLabel
                        value="Deluxe"
                        control={<Radio />}
                        label="Deluxe"
                      />
                      <FormControlLabel
                        value="Suite"
                        control={<Radio />}
                        label="Suite"
                      />
                    </RadioGroup>

                    {upgrade !== "none" && (
                      <Box sx={{ mt: 1 }}>
                        <TextField
                          label="Cọc thêm (VND, tùy chính sách)"
                          type="number"
                          fullWidth
                          value={extraDeposit}
                          onChange={(e) =>
                            setExtraDeposit(Number(e.target.value))
                          }
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
          {((tab === 0 && activeStep === 3) ||
            (tab === 1 && activeStep === 3)) && (
            <Card>
              <CardContent>
                <BlockHeader
                  icon={<MeetingRoomIcon fontSize="small" />}
                  title="Gán phòng & phát key"
                  subtitle={
                    "Phòng sẽ được tự động gán theo đặt phòng và tình trạng hiện tại"
                  }
                />

                {/* Current assigned rooms per type with option to reassign */}
                {Object.keys(selectedRoomsByType).length > 0 ? (
                  <Stack spacing={2} sx={{ mb: 2 }}>
                    {Object.entries(selectedRoomsByType).map(
                      ([typeId, rooms]) => (
                        <Card key={typeId} variant="outlined">
                          <CardContent>
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              justifyContent="space-between"
                              alignItems={{ xs: "flex-start", sm: "center" }}
                              spacing={1.5}
                            >
                              <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                  {roomTypeNames[typeId] || "Loại phòng"} —{" "}
                                  {rooms.length} phòng
                                </Typography>
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  flexWrap="wrap"
                                >
                                  {rooms.map((r) => (
                                    <Chip
                                      key={r._id}
                                      label={`Phòng ${
                                        r.roomNumber || r.name || r._id
                                      }`}
                                      size="small"
                                    />
                                  ))}
                                </Stack>
                              </Box>
                              <Button
                                variant="outlined"
                                onClick={() => openRoomPicker(typeId)}
                                disabled={
                                  (availableRoomsByType[typeId] || [])
                                    .length === 0
                                }
                              >
                                Đổi phòng
                              </Button>
                            </Stack>
                          </CardContent>
                        </Card>
                      )
                    )}
                  </Stack>
                ) : (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Chưa có thông tin phòng — hệ thống sẽ tự động gán dựa trên
                    đặt phòng.
                  </Alert>
                )}

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  alignItems="center"
                >
                  <TextField
                    label={"Ghi chú phát key (tuỳ chọn)"}
                    value={roomSelected}
                    onChange={(e) => setRoomSelected(e.target.value)}
                    fullWidth
                    placeholder="VD: Đã phát 2 thẻ."
                  />
                  <Chip
                    icon={<LockIcon />}
                    label="Auto-assign"
                    variant="outlined"
                  />

                  <FormControl fullWidth>
                    <InputLabel>Phương thức key</InputLabel>
                    <Select
                      label="Phương thức key"
                      value={keyMethod}
                      onChange={(e) => setKeyMethod(e.target.value as any)}
                    >
                      <MenuItem value="card">Thẻ từ</MenuItem>
                      <MenuItem value="pin">Mã PIN</MenuItem>
                      <MenuItem value="qr">QR code</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="outlined"
                    startIcon={<VpnKeyIcon />}
                    onClick={() => setOpenKeyDialog(true)}
                    disabled={!roomSelected}
                  >
                    Phát key
                  </Button>
                </Stack>

                <Alert
                  icon={<WarningAmberIcon />}
                  severity="warning"
                  sx={{ mt: 2 }}
                >
                  Kiểm tra tình trạng phòng (Clean/Dirty/OOO) trước khi gán.
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* REVIEW */}
          {((tab === 0 && activeStep === 4) ||
            (tab === 1 && activeStep === 4)) && (
            <Card>
              <CardContent>
                <BlockHeader
                  icon={<CheckCircleIcon fontSize="small" />}
                  title="Xác nhận check-in"
                />
                {selected ? (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                      gap: 2,
                    }}
                  >
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          Khách & booking
                        </Typography>
                        <Stack spacing={0.5}>
                          <Row
                            label="Khách"
                            value={selected.customer?.fullname || "—"}
                          />
                          <Row
                            label="SĐT"
                            value={selected.customer?.phone || "—"}
                          />
                          <Row
                            label="Email"
                            value={selected.customer?.email || "—"}
                          />
                          <Row
                            label="Khách sạn"
                            value={selected.hotel?.name || "—"}
                          />
                          <Row
                            label="Check-in"
                            value={new Date(
                              selected.checkInDate
                            ).toLocaleDateString("vi-VN")}
                          />
                          <Row
                            label="Check-out"
                            value={new Date(
                              selected.checkOutDate
                            ).toLocaleDateString("vi-VN")}
                          />
                          <Row label="Số đêm" value={`${totalNights}`} />
                          <Row label="Payment" value={selected.paymentStatus} />
                        </Stack>
                      </CardContent>
                    </Card>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          Nhận phòng
                        </Typography>
                        <Stack spacing={0.5}>
                          <Row
                            label="Nâng hạng"
                            value={upgrade === "none" ? "Không" : upgrade}
                          />
                          <Row
                            label="Phòng thực tế"
                            value={roomSelected || "—"}
                          />
                          <Row label="Key" value={keyMethod.toUpperCase()} />
                          {upgrade !== "none" && (
                            <Row
                              label="Cọc thêm"
                              value={formatVND(
                                Number.isFinite(extraDeposit) ? extraDeposit : 0
                              )}
                            />
                          )}
                          {tab === 1 && (
                            <Row
                              label="Face match"
                              value={faceScore !== null ? `${faceScore}%` : "—"}
                            />
                          )}
                          <Row
                            label="Early CI"
                            value={earlyCheckin ? "Yes" : "No"}
                          />
                          <Row
                            label="Extra bed"
                            value={extraBed ? "Yes" : "No"}
                          />
                          <Row label="Thêm người lớn" value={`${addAdult}`} />
                          {internalNote && (
                            <Row label="Ghi chú" value={internalNote} />
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                    <Box sx={{ gridColumn: "1 / -1" }}>
                      <Alert severity="info">
                        Đặt qua web đã thanh toán/cọc. Chỉ hiển thị “Cọc thêm”
                        nếu nâng hạng.
                      </Alert>
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="warning">
                    Vui lòng chọn booking ở bước 1.
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </Box>

        {/* RIGHT: summary (sticky) */}
        <Box>
          <Card sx={{ position: { md: "sticky" }, top: { md: 84 } }}>
            <CardContent>
              <BlockHeader
                icon={<PersonSearchIcon fontSize="small" />}
                title="Tóm tắt booking"
              />
              {selected ? (
                <Stack spacing={0.75}>
                  <Row label="Khách" value={selected.customer?.fullname} />
                  <Row label="Khách sạn" value={selected.hotel?.name} />
                  <Row
                    label="Check-in"
                    value={new Date(selected.checkInDate).toLocaleDateString(
                      "vi-VN"
                    )}
                  />
                  <Row
                    label="Check-out"
                    value={new Date(selected.checkOutDate).toLocaleDateString(
                      "vi-VN"
                    )}
                  />
                  <Row label="Số đêm" value={`${totalNights}`} />
                  <Row
                    label="Payment"
                    value={
                      paymentSummary?.paymentStatus || selected.paymentStatus
                    }
                  />
                  <Divider sx={{ my: 1 }} />
                  <Row label="Tổng tiền phòng" value={formatVND(totalPrice)} />
                  <Row label="Đã thanh toán" value={formatVND(paidAmount)} />
                  <Row label="Cọc yêu cầu" value={formatVND(depositAmount)} />
                  <Row label="Còn lại" value={formatVND(remainingAmount)} />
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Chưa chọn booking.
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              <Stack direction="row" spacing={1} justifyContent="space-between">
                <Button disabled={activeStep === 0} onClick={handleBack}>
                  Quay lại
                </Button>
                {activeStep < steps.length - 1 ? (
                  <Button
                    variant="contained"
                    disabled={!canNext}
                    onClick={handleNext}
                  >
                    Tiếp tục
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    disabled={!selected || (tab === 1 && !faceOK)}
                    onClick={async () => {
                      if (!selected) return;
                      try {
                        // Luôn build selections (manual & face đều cần)
                        const selections = Object.entries(
                          selectedRoomsByType
                        ).map(([roomTypeId, rooms]) => ({
                          roomTypeId,
                          roomIds: rooms.map((r) => r._id),
                        }));

                        // ---------- MANUAL FLOW: kiểm tra & gửi idVerifications ----------
                        let payload: any = { selections };

                        if (tab === 0) {
                          const currentRooms =
                            Object.values(selectedRoomsByType).flat();

                          const missingId = currentRooms.find((r) => {
                            const doc = idDocs[r._id];
                            return (
                              !doc ||
                              !(doc.number || "").trim() ||
                              !(doc.nameOnId || "").trim()
                            );
                          });

                          if (missingId) {
                            alert(
                              "Vui lòng nhập giấy tờ cho tất cả các phòng đã chọn."
                            );
                            setActiveStep(1); // quay về bước Nhập giấy tờ
                            return;
                          }

                          const idVerifications = currentRooms.map((r) => {
                            const doc = idDocs[r._id] || {
                              type: "cccd" as IdType,
                              number: "",
                              nameOnId: "",
                            };
                            let number = doc.number || "";
                            if (
                              (doc.type || "cccd") === "cccd" ||
                              doc.type === "cmnd"
                            ) {
                              number = number.replace(/\D/g, "");
                            } else {
                              number = number.toUpperCase();
                            }
                            return {
                              roomId: r._id,
                              idDocument: {
                                type: (doc.type || "cccd") as IdType,
                                number,
                                nameOnId: doc.nameOnId || "",
                                address: doc.address || "",
                                method: "manual" as const,
                              },
                            };
                          });

                          payload.idVerifications = idVerifications;
                        }

                        // ---------- FACE FLOW: đính kèm thông tin nhận diện khuôn mặt ----------
                        if (tab === 1) {
                          payload.faceVerification = {
                            success: faceVerified,
                            score: faceScore,
                            user: faceUserData,
                            method: "face",
                          };
                          // tuỳ backend: nếu không cần idVerifications thì không gán gì thêm
                        }

                        // Gọi API chung cho cả 2 flow
                        await apiConfirmCheckin(selected.id, payload);

                        // Refresh list để booking vừa check-in biến mất khỏi danh sách
                        await doSearch();
                        resetAll();
                      } catch (e: any) {
                        alert(
                          e?.response?.data?.message || "Check-in thất bại"
                        );
                      }
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

      {/* Dialog chọn phòng: ẩn trong API-driven flow (auto-assign) */}
      {/* Room reassignment dialog */}
      <Dialog
        open={roomPickerOpen}
        onClose={closeRoomPicker}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Chọn phòng khác</DialogTitle>
        <DialogContent dividers>
          {roomPickerTypeId && (
            <>
              <Typography variant="body2" gutterBottom>
                {roomTypeNames[roomPickerTypeId] || "Loại phòng"} — cần chọn
                đúng {(selectedRoomsByType[roomPickerTypeId] || []).length}{" "}
                phòng
              </Typography>
              {(availableRoomsByType[roomPickerTypeId] || []).length === 0 ? (
                <Alert severity="info">
                  Không còn phòng trống khác để đổi.
                </Alert>
              ) : (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {(availableRoomsByType[roomPickerTypeId] || []).map((r) => {
                    const picked = pickerTempIds.includes(r._id);
                    return (
                      <Chip
                        key={r._id}
                        label={`Phòng ${r.roomNumber || r.name || r._id}`}
                        color={picked ? "primary" : "default"}
                        variant={picked ? "filled" : "outlined"}
                        onClick={() => togglePickRoom(r._id)}
                        sx={{ mb: 1 }}
                      />
                    );
                  })}
                </Stack>
              )}
              {pickerError && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {pickerError}
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRoomPicker}>Hủy</Button>
          <Button
            variant="contained"
            onClick={applyRoomPicker}
            disabled={!roomPickerTypeId}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog phát key */}
      <Dialog
        open={openKeyDialog}
        onClose={() => setOpenKeyDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Phát key phòng</DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            (UI demo) Giả lập encoder / sinh PIN / tạo QR cho phòng{" "}
            {roomSelected || "—"}.
          </Alert>
          <FormControl fullWidth>
            <InputLabel>Phương thức</InputLabel>
            <Select
              label="Phương thức"
              value={keyMethod}
              onChange={(e) => setKeyMethod(e.target.value as any)}
            >
              <MenuItem value="card">Thẻ từ</MenuItem>
              <MenuItem value="pin">Mã PIN</MenuItem>
              <MenuItem value="qr">QR code</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ mt: 2 }}>
            {keyMethod === "pin" && (
              <TextField
                fullWidth
                label="PIN (auto-generated)"
                defaultValue="843219"
              />
            )}
            {keyMethod === "qr" && (
              <Box
                sx={{
                  p: 2,
                  border: "1px dashed #ddd",
                  borderRadius: 1,
                  textAlign: "center",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  QR preview (mock)
                </Typography>
                <Box sx={{ height: 120, bgcolor: "#eee", mt: 1 }} />
              </Box>
            )}
            {keyMethod === "card" && (
              <Typography variant="body2" color="text.secondary">
                Đưa thẻ vào encoder… (mock)
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenKeyDialog(false)}>Đóng</Button>
          <Button variant="contained" onClick={() => setOpenKeyDialog(false)}>
            Phát key
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel reservation dialog */}
      <Dialog
        open={!!cancelingId}
        onClose={() => setCancelingId(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Hủy đặt phòng</DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Hành động này sẽ hủy đặt phòng. Vui lòng nhập lý do.
          </Alert>
          <TextField
            label="Lý do hủy"
            fullWidth
            multiline
            minRows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelingId(null)}>Đóng</Button>
          <Button
            variant="contained"
            color="error"
            disabled={!cancelReason.trim()}
            onClick={async () => {
              if (!cancelingId) return;
              try {
                await apiCancelReservation(cancelingId, cancelReason.trim());
                // refresh list and clear selection if needed
                if (selected?.id === cancelingId) setSelected(null);
                await doSearch();
                setCancelingId(null);
              } catch (e: any) {
                alert(e?.response?.data?.message || "Hủy đặt phòng thất bại");
              }
            }}
          >
            Xác nhận hủy
          </Button>
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
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={600}
        textAlign="right"
        sx={{ ml: 2 }}
      >
        {value}
      </Typography>
    </Stack>
  );
}
