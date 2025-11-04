import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Typography,
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
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { useLocation } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import PaymentsIcon from "@mui/icons-material/Payments";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PrintIcon from "@mui/icons-material/Print";
import EmailIcon from "@mui/icons-material/Email";
import IosShareIcon from "@mui/icons-material/IosShare";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { listInHouseStays, createCheckoutPayment, verifyCheckoutPayment, confirmCheckout } from "../../api/dashboard";

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
   TYPES & MOCK DATA
   ======================= */
// Accept any room type name returned from backend
type RoomType = string;
type LineStatus = "POSTED" | "VOIDED" | "ADJUSTED";
type LineSource = "WEB_ADDON" | "MINIBAR" | "POS" | "FRONTDESK" | "INSPECTION";

type InHouse = {
  stayId: string;              // Mã StayID dùng xuyên suốt
  roomId?: string;             // Room ID for partial checkout (optional when selecting all)
  guestName: string;
  phone: string;
  email: string;
  roomType: RoomType;
  roomNumber: string;
  checkIn: string;
  checkOutPlan: string;        // dự kiến
  pricePerNight: number;       // VND
  nightsSoFar: number;
  deposit: number;             // VND (đã nhận trước)
  prepostedServices?: FolioItem[]; // Services từ booking (optional)
};

type FolioItem = {
  id: string;
  type: "room" | "service" | "fee" | "adjustment";
  desc: string;
  qty: number;
  amount: number;              // đơn giá VND (âm cho giảm trừ)
  source: LineSource;
  status: LineStatus;
  note?: string;
  ts: string;                  // thời điểm post
  by?: string;                 // ai post
};

// In-house list will be fetched from backend

// Mock phát sinh đã có SẴN (web add-on, minibar, POS, front desk)
const PREPOSTED_LINES: Record<string, FolioItem[]> = {
  STAY001: [
    // add-on đặt trên web
    {
      id: "web-brk",
      type: "service",
      desc: "Bữa sáng cho 2 người / ngày",
      qty: 2,
      amount: 150_000,
      source: "WEB_ADDON",
      status: "POSTED",
      ts: "2025-10-18 14:20",
      by: "system",
      note: "Đặt kèm trên web",
    },
    // minibar phát sinh trong kỳ
    {
      id: "mb-1",
      type: "service",
      desc: "Minibar - Bia lon",
      qty: 2,
      amount: 45_000,
      source: "MINIBAR",
      status: "POSTED",
      ts: "2025-10-19 10:05",
      by: "HK.Nguyen",
      note: "HK kiểm kê",
    },
    // POS nhà hàng post to room
    {
      id: "pos-001",
      type: "service",
      desc: "NH ViewBar - Set lunch",
      qty: 1,
      amount: 320_000,
      source: "POS",
      status: "POSTED",
      ts: "2025-10-19 12:45",
      by: "POS",
    },
    // Front desk post phí nâng hạng (ví dụ)
    {
      id: "fd-upg",
      type: "service",
      desc: "Phụ thu nâng hạng Deluxe",
      qty: 1,
      amount: 300_000,
      source: "FRONTDESK",
      status: "POSTED",
      ts: "2025-10-18 15:00",
      by: "FD.Anh",
    },
  ],
  STAY002: [
    {
      id: "web-pu",
      type: "service",
      desc: "Đưa đón sân bay (xe 4 chỗ)",
      qty: 1,
      amount: 180_000,
      source: "WEB_ADDON",
      status: "POSTED",
      ts: "2025-10-18 13:50",
      by: "system",
    },
  ],
};

/* =======================
   STEPS
   ======================= */
const steps = [
  { key: "lookup", label: "Tra cứu" },
  { key: "review", label: "Rà soát phát sinh" },          // chỉ rà soát, không thêm mới
  { key: "inspect", label: "Kiểm phòng & phụ phí" },      // Late CO / hư hại / mất khóa
  { key: "invoice", label: "Hóa đơn & thanh toán" },
  { key: "return", label: "Trả key & ghi chú" },
  { key: "confirm", label: "Xác nhận" },                  // Export final bill / Process refund request
] as const;

/* =======================
   COMPONENT
   ======================= */

export default function CheckOut() {
  // Nhận data từ navigation state (từ StaffBookings)
  const location = useLocation();
  const passedStayData = location.state?.stayData as InHouse | undefined;

  const [activeStep, setActiveStep] = useState(0);

  /** Step 1: Lookup */
  const [query, setQuery] = useState("");
  const [inHouse, setInHouse] = useState<InHouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<InHouse | null>(null);
  const [selectedAll, setSelectedAll] = useState<boolean>(false);
  const [selectedStayId, setSelectedStayId] = useState<string | null>(null);
  const [selectedRooms, setSelectedRooms] = useState<InHouse[]>([]);

  // Load in-house list from backend
  const loadList = async (q?: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await listInHouseStays(q);
      // API returns minimal fields; map directly to our InHouse type
      const items = (res.inHouse || []).map((it) => ({
        stayId: it.stayId,
        roomId: it.roomId,
        guestName: it.guestName,
        phone: it.phone,
        email: it.email,
        roomType: it.roomType as RoomType,
        roomNumber: it.roomNumber,
        checkIn: typeof it.checkIn === "string" ? it.checkIn : new Date(it.checkIn).toISOString(),
        checkOutPlan:
          typeof it.checkOutPlan === "string"
            ? it.checkOutPlan
            : new Date(it.checkOutPlan).toISOString(),
        pricePerNight: it.pricePerNight,
        nightsSoFar: it.nightsSoFar,
        deposit: it.deposit,
      })) as InHouse[];
      setInHouse(items);
      // if current selection belongs to a stay no longer listed, clear it
      setSelected((cur) => (cur && !items.some(i => i.stayId === cur.stayId && (selectedAll ? true : i.roomId === cur.roomId)) ? null : cur));
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Failed to load in-house list");
    } finally {
      setLoading(false);
    }
  };

  /** Folio items */
  const [folio, setFolio] = useState<FolioItem[]>([]);
  const [note, setNote] = useState("");

  // Khi chọn khách → load dòng tiền phòng + các dòng đã post sẵn
  const initRoomLines = (stay: InHouse): FolioItem[] => {
    const items: FolioItem[] = [];
    for (let i = 0; i < stay.nightsSoFar; i++) {
      items.push({
        id: `room-${i}`,
        type: "room",
        desc: `Tiền phòng đêm ${i + 1}`,
        qty: 1,
        amount: stay.pricePerNight,
        source: "FRONTDESK",
        status: "POSTED",
        ts: `${stay.checkIn} +${i}d`,
        by: "system",
      });
    }
    return items;
  };

  const rebuildFolioFromSelection = (rooms: InHouse[], stayId: string) => {
    const lines: FolioItem[] = [];
    rooms.forEach(r => { lines.push(...initRoomLines(r)); });
    const pre = PREPOSTED_LINES[stayId] || [];
    setFolio([...lines, ...pre]);
  };

  const pickStay = (stay: InHouse) => {
    setSelectedAll(false);
    setSelectedStayId(stay.stayId);
    setSelectedRooms([stay]);
    rebuildFolioFromSelection([stay], stay.stayId);
    setSelected(stay);
    setNote("");
    setLateCheckout("none");
    setDamageFee(0);
    setLostKey(false);
    setPaymentAction("none");
    setRefundRequested(false);
  };

  const pickStayAll = (stayId: string) => {
    const groupRooms = inHouse.filter(i => i.stayId === stayId);
    if (groupRooms.length === 0) return;
    rebuildFolioFromSelection(groupRooms, stayId);
    const rep = groupRooms[0];
    setSelected({ ...rep, roomId: undefined });
    setSelectedRooms(groupRooms);
    setSelectedStayId(stayId);
    setSelectedAll(true);
    setNote("");
    setLateCheckout("none");
    setDamageFee(0);
    setLostKey(false);
    setPaymentAction("none");
    setRefundRequested(false);
  };

  const toggleRoom = (stayId: string, room: InHouse) => {
    if (selectedStayId && selectedStayId !== stayId) {
      setSelectedRooms([room]);
      setSelectedStayId(stayId);
      setSelectedAll(false);
      setSelected(room);
      rebuildFolioFromSelection([room], stayId);
      return;
    }
    const exists = selectedRooms.some(r => (r.roomId || r.roomNumber) === (room.roomId || room.roomNumber));
    const next = exists ? selectedRooms.filter(r => (r.roomId || r.roomNumber) !== (room.roomId || room.roomNumber)) : [...selectedRooms, room];
    setSelectedRooms(next);
    setSelectedStayId(stayId);
    const allRoomsInGroup = inHouse.filter(i => i.stayId === stayId);
    setSelectedAll(next.length > 0 && next.length === allRoomsInGroup.length);
    setSelected(next[0] || null);
    rebuildFolioFromSelection(next, stayId);
  };

  const unselectAll = (stayId: string) => {
    setSelectedRooms([]);
    setSelectedAll(false);
    setSelected(null);
    setSelectedStayId(stayId);
    setFolio([]);
  };

  /** Bước 3: phụ phí kiểm phòng */
  const [lateCheckout, setLateCheckout] = useState<"none" | "half" | "full">("none");
  const [damageFee, setDamageFee] = useState<number>(0);
  const [lostKey, setLostKey] = useState<boolean>(false);

  // late fee = 50% hoặc 100% giá/đêm
  const lateFee = useMemo(() => {
    if (!selected) return 0;
    if (lateCheckout === "half") return Math.round(selected.pricePerNight * 0.5);
    if (lateCheckout === "full") return selected.pricePerNight;
    return 0;
  }, [lateCheckout, selected]);

  // đảm bảo/đồng bộ các fee kiểm phòng (INSPECTION)
  useEffect(() => {
    ensureOrRemoveFee("fee-late", "Phụ phí check-out trễ", lateFee);
  }, [lateFee]);

  useEffect(() => {
    ensureOrRemoveFee("fee-damage", "Tiền đền bù hư hại", damageFee > 0 ? damageFee : 0);
  }, [damageFee]);

  useEffect(() => {
    const lostKeyFee = lostKey ? 200_000 : 0;
    ensureOrRemoveFee("fee-key", "Phí mất thẻ/khóa phòng", lostKeyFee);
  }, [lostKey]);

  const ensureOrRemoveFee = (id: string, label: string, price: number) => {
    setFolio((arr) => {
      const idx = arr.findIndex((x) => x.id === id);
      if (price <= 0) {
        if (idx >= 0) {
          const clone = arr.slice();
          clone.splice(idx, 1);
          return clone;
        }
        return arr;
      }
      if (idx >= 0) {
        const clone = arr.slice();
        clone[idx] = {
          ...clone[idx],
          amount: price,
          qty: 1,
          status: "POSTED",
          source: "INSPECTION",
        };
        return clone;
      }
      return [
        ...arr,
        {
          id,
          type: "fee",
          desc: label,
          qty: 1,
          amount: price,
          source: "INSPECTION",
          status: "POSTED",
          ts: new Date().toISOString(),
          by: "HK/FD",
        },
      ];
    });
  };

  /** Step 4: Invoice & payment */
  const [paymentAction, setPaymentAction] = useState<"collect" | "refund" | "none">("none");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "qr">("cash");
  const [qrLink, setQrLink] = useState<string | null>(null);
  const [requiresPayment, setRequiresPayment] = useState<boolean>(false);
  const [paymentVerified, setPaymentVerified] = useState<boolean>(false);
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  const [verifyLoading, setVerifyLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  /** Derived totals (chỉ tính các dòng không VOided) */
  const effectiveLines = useMemo(
    () => folio.filter((l) => l.status !== "VOIDED"),
    [folio]
  );

  const subtotal = useMemo(
    () => effectiveLines.reduce((sum, it) => sum + it.amount * it.qty, 0),
    [effectiveLines]
  );

  // Apply deposit only when selecting all rooms of the stay (to avoid double counting on partial)
  const deposit = selectedAll && selected ? (selected.deposit || 0) : 0;
  const taxes = useMemo(() => Math.round(subtotal * 0.08), [subtotal]); // VAT 8% (mock)
  const totalDue = useMemo(() => subtotal + taxes - deposit, [subtotal, taxes, deposit]);

  /** Export final bill dialog */
  const [exportOpen, setExportOpen] = useState(false);
  const [exportEmail, setExportEmail] = useState("");
  const [exportIncludeCompany, setExportIncludeCompany] = useState(true);
  const [exportLanguage, setExportLanguage] = useState<"vi" | "en">("vi");

  /** Refund request dialog */
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundMethod, setRefundMethod] = useState<"cash" | "card" | "qr">("cash");
  const [refundReason, setRefundReason] = useState("");
  const [refundReceiver, setRefundReceiver] = useState("");
  const [refundInfo, setRefundInfo] = useState(""); // STK/last4/QR ref
  const [refundRequested, setRefundRequested] = useState(false);

  /** Step nav */
  const canNext = useMemo(() => {
    if (activeStep === 0) return !!selected;
    if (activeStep === 1) return true; // chỉ rà soát
    if (activeStep === 2) return true; // phụ phí kiểm phòng
    if (activeStep === 3) {
      if (totalDue > 0) return paymentAction === "collect";
      if (totalDue < 0) return paymentAction === "refund";
      return true;
    }
    if (activeStep === 4) return true;
    return true;
  }, [activeStep, selected, totalDue, paymentAction]);

  const handleNext = () => setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const resetAll = () => {
    setActiveStep(0);
    setQuery("");
    setSelected(null);
    setFolio([]);
    setNote("");
    setLateCheckout("none");
    setDamageFee(0);
    setLostKey(false);
    setPaymentAction("none");
    setPaymentMethod("cash");
    setQrLink(null);
    setRequiresPayment(false);
    setPaymentVerified(false);
    setCheckoutLoading(false);
    setVerifyLoading(false);
    setActionError(null);
    setExportOpen(false);
    setRefundOpen(false);
    setRefundRequested(false);
  };

  /** Adjust & Void dialogs */
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState(false);
  const [targetLine, setTargetLine] = useState<FolioItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustNote, setAdjustNote] = useState<string>("");
  const [voidReason, setVoidReason] = useState<string>("");

  const openAdjust = (line: FolioItem) => {
    setTargetLine(line);
    setAdjustAmount(0);
    setAdjustNote("");
    setAdjustOpen(true);
  };

  const applyAdjust = () => {
    if (!targetLine || adjustAmount === 0) {
      setAdjustOpen(false);
      return;
    }
    // thêm 1 dòng adjustment (âm hoặc dương)
    setFolio((arr) => [
      ...arr,
      {
        id: `adj-${Date.now()}`,
        type: "adjustment",
        desc: `Điều chỉnh: ${targetLine.desc}`,
        qty: 1,
        amount: adjustAmount,          // có thể âm hoặc dương
        source: "FRONTDESK",
        status: "ADJUSTED",
        ts: new Date().toISOString(),
        by: "FD.User",
        note: adjustNote,
      },
    ]);
    setAdjustOpen(false);
  };

  const openVoid = (line: FolioItem) => {
    setTargetLine(line);
    setVoidReason("");
    setVoidOpen(true);
  };

  const applyVoid = () => {
    if (!targetLine) {
      setVoidOpen(false);
      return;
    }
    setFolio((arr) =>
      arr.map((l) =>
        l.id === targetLine.id ? { ...l, status: "VOIDED", note: voidReason } : l
      )
    );
    setVoidOpen(false);
  };

  /** UI helpers */
  const BlockHeader = ({
    icon,
    title,
    subtitle,
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
  }) => (
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

  const sourceLabel = (s: LineSource) =>
    s === "WEB_ADDON" ? "Web Add-on" :
    s === "MINIBAR" ? "Minibar" :
    s === "POS" ? "POS" :
    s === "FRONTDESK" ? "Front Desk" :
    "Inspection";

  const statusChip = (st: LineStatus) =>
    st === "POSTED" ? <Chip size="small" color="success" label="Posted" /> :
    st === "VOIDED" ? <Chip size="small" color="default" label="Voided" /> :
    <Chip size="small" color="warning" label="Adjusted" />;

  // Initial load: fetch all in-house stays
  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-select stay nếu được truyền từ StaffBookings (đặt sau khi tất cả states đã setup)
  useEffect(() => {
    if (passedStayData && !selected) {
      // nếu không có trong danh sách hiện tại, bổ sung tạm để thao tác
      const exists = inHouse.some((s) => s.stayId === passedStayData.stayId);
      if (!exists) setInHouse((arr) => [...arr, passedStayData]);
      pickStay(passedStayData);
      setQuery(passedStayData.stayId);
      setActiveStep(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passedStayData, inHouse, selected]);

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} mb={1}>
        Check-out
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Quy trình: Tra cứu → Rà soát phát sinh → Kiểm phòng & phụ phí → Hóa đơn & thanh toán → Trả key & ghi chú → Xác nhận.
      </Typography>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 2 }}>
        {steps.map((s) => (
          <Step key={s.key}>
            <StepLabel>{s.label}</StepLabel>
          </Step>
        ))}
      </Stepper>

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
                  title="Tra cứu khách đang lưu trú"
                  subtitle="Nhập StayID, số phòng, tên hoặc SĐT"
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <TextField
                    fullWidth
                    label="StayID/Số phòng/Tên/SĐT"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        loadList(query);
                      }
                    }}
                  />
                  <Button variant="contained" onClick={() => loadList(query)}>Tìm</Button>
                </Stack>

                {/* Grouped by stay using Accordions */}
                <Box sx={{ mt: 2 }}>
                  {loading && (
                    <Alert severity="info">Đang tải...</Alert>
                  )}
                  {error && !loading && (
                    <Alert severity="error">{error}</Alert>
                  )}
                  {!loading && !error && (() => {
                    const groups = inHouse.reduce((acc: Record<string, InHouse[]>, item) => {
                      acc[item.stayId] = acc[item.stayId] || [];
                      acc[item.stayId].push(item);
                      return acc;
                    }, {});
                    const entries = Object.entries(groups);
                    if (entries.length === 0) {
                      return <Alert severity="warning">Không có khách đang lưu trú.</Alert>;
                    }
                    return (
                      <Box>
                        {entries.map(([sid, rooms]) => {
                          const head = rooms[0];
                          const roomCount = rooms.length;
                          const title = `${head.guestName} • ${roomCount} phòng`;
                          return (
                            <Accordion key={sid} sx={{ mb: 1 }}>
                              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', width: '100%', alignItems: 'center', gap: 1 }}>
                                  <Chip size="small" label={`Stay ${sid.slice(-6)}`} />
                                  <Typography sx={{ flexGrow: 1 }} fontWeight={600}>{title}</Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    CI: {new Date(head.checkIn).toLocaleString()} • CO: {new Date(head.checkOutPlan).toLocaleString()}
                                  </Typography>
                                  <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
                                    <Button size="small" variant="outlined" onClick={() => pickStayAll(sid)}>Chọn tất cả</Button>
                                    <Button size="small" color="error" variant="text" onClick={() => unselectAll(sid)}>Hủy chọn tất cả</Button>
                                  </Stack>
                                </Box>
                              </AccordionSummary>
                              <AccordionDetails>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Phòng</TableCell>
                                      <TableCell>Hạng</TableCell>
                                      <TableCell>Giá/đêm</TableCell>
                                      <TableCell>Cọc</TableCell>
                                      <TableCell align="right">Chọn</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {rooms.map(r => (
                                      <TableRow key={r.roomId || r.roomNumber} hover selected={selectedRooms.some(x => (x.roomId || x.roomNumber) === (r.roomId || r.roomNumber))}>
                                        <TableCell>{r.roomNumber}</TableCell>
                                        <TableCell>{r.roomType}</TableCell>
                                        <TableCell>{formatVND(r.pricePerNight)}</TableCell>
                                        <TableCell>{formatVND(r.deposit)}</TableCell>
                                        <TableCell align="right">
                                          {selectedRooms.some(x => (x.roomId || x.roomNumber) === (r.roomId || r.roomNumber)) ? (
                                            <Button size="small" color="error" onClick={() => toggleRoom(sid, r)} variant="outlined">Bỏ chọn</Button>
                                          ) : (
                                            <Button size="small" onClick={() => toggleRoom(sid, r)} variant="outlined">Chọn</Button>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </AccordionDetails>
                            </Accordion>
                          );
                        })}
                      </Box>
                    );
                  })()}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: REVIEW LINES (no add; only adjust/void) */}
          {activeStep === 1 && (
            <Card>
              <CardContent>
                <BlockHeader
                  icon={<ReceiptLongIcon fontSize="small" />}
                  title="Rà soát phát sinh"
                  subtitle="Các khoản đã được ghi nhận trong suốt kỳ lưu trú (Web add-on, Minibar, POS, Front Desk…). Có thể điều chỉnh/huỷ với lý do."
                />
                {!selected ? (
                  <Alert severity="warning">Vui lòng chọn khách ở bước 1.</Alert>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Loại</TableCell>
                        <TableCell>Mô tả</TableCell>
                        <TableCell>Nguồn</TableCell>
                        <TableCell>Trạng thái</TableCell>
                        <TableCell>SL</TableCell>
                        <TableCell>Đơn giá</TableCell>
                        <TableCell>Tổng</TableCell>
                        <TableCell>Ghi chú</TableCell>
                        <TableCell align="right">Thao tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {folio.map((it) => (
                        <TableRow key={it.id} hover>
                          <TableCell>
                            {it.type === "room"
                              ? "Tiền phòng"
                              : it.type === "service"
                              ? "Dịch vụ"
                              : it.type === "fee"
                              ? "Phụ phí"
                              : "Điều chỉnh"}
                          </TableCell>
                          <TableCell>{it.desc}</TableCell>
                          <TableCell>{sourceLabel(it.source)}</TableCell>
                          <TableCell>{statusChip(it.status)}</TableCell>
                          <TableCell>{it.qty}</TableCell>
                          <TableCell>{formatVND(it.amount)}</TableCell>
                          <TableCell>{formatVND(it.amount * it.qty)}</TableCell>
                          <TableCell>{it.note || "—"}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button
                                size="small"
                                startIcon={<EditIcon />}
                                onClick={() => openAdjust(it)}
                                disabled={it.status === "VOIDED"}
                              >
                                Adjust
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                startIcon={<BlockIcon />}
                                onClick={() => openVoid(it)}
                                disabled={it.type === "room" || it.status === "VOIDED"}
                              >
                                Void
                              </Button>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                      {folio.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9}>
                            <Typography variant="body2" color="text.secondary">
                              Chưa có khoản mục.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* STEP 3: INSPECTION FEES */}
          {activeStep === 2 && (
            <Card>
              <CardContent>
                <BlockHeader
                  icon={<CleaningServicesIcon fontSize="small" />}
                  title="Kiểm phòng & phụ phí"
                  subtitle="Áp dụng phụ phí check-out trễ, đền bù hư hại, mất khóa… (ghi nhận tại thời điểm check-out)."
                />
                {!selected ? (
                  <Alert severity="warning">Vui lòng chọn khách ở bước 1.</Alert>
                ) : (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600} gutterBottom>
                        Check-out trễ
                      </Typography>
                      <RadioGroup
                        value={lateCheckout}
                        onChange={(e) =>
                          setLateCheckout(e.target.value as "none" | "half" | "full")
                        }
                      >
                        <FormControlLabel value="none" control={<Radio />} label="Đúng giờ (không phụ phí)" />
                        <FormControlLabel
                          value="half"
                          control={<Radio />}
                          label={`Nửa ngày (${selected ? formatVND(Math.round(selected.pricePerNight * 0.5)) : "-"})`}
                        />
                        <FormControlLabel
                          value="full"
                          control={<Radio />}
                          label={`Một ngày (${selected ? formatVND(selected.pricePerNight) : "-"})`}
                        />
                      </RadioGroup>
                    </Box>

                    <Box>
                      <Typography variant="body2" fontWeight={600} gutterBottom>
                        Hư hại & mất khóa
                      </Typography>
                      <Stack spacing={1}>
                        <TextField
                          label="Tiền đền bù hư hại (VND)"
                          type="number"
                          value={damageFee}
                          onChange={(e) => setDamageFee(Number(e.target.value))}
                        />
                        <FormControlLabel
                          control={<Checkbox checked={lostKey} onChange={(e) => setLostKey(e.target.checked)} />}
                          label="Mất thẻ/khóa phòng (200.000₫)"
                        />
                      </Stack>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* STEP 4: INVOICE & PAYMENT */}
          {activeStep === 3 && (
            <Card>
              <CardContent>
                <BlockHeader
                  icon={<PaymentsIcon fontSize="small" />}
                  title="Hóa đơn & thanh toán"
                  subtitle="Kiểm tra công nợ, chọn hành động và phương thức"
                />
                {!selected ? (
                  <Alert severity="warning">Vui lòng chọn khách ở bước 1.</Alert>
                ) : (
                  <>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Tạm tính: <b>{formatVND(subtotal)}</b> • Thuế (8%):{" "}
                      <b>{formatVND(taxes)}</b> • Cọc đã nhận:{" "}
                      <b>{formatVND(deposit)}</b> →{" "}
                      {totalDue > 0 ? (
                        <>Khách <b>cần trả thêm</b>: <b>{formatVND(totalDue)}</b></>
                      ) : totalDue < 0 ? (
                        <><b>Cần hoàn lại</b> cho khách: <b>{formatVND(-totalDue)}</b></>
                      ) : (
                        <>Không phát sinh chênh lệch</>
                      )}
                    </Alert>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600} gutterBottom>
                          Hành động
                        </Typography>
                        <RadioGroup
                          value={paymentAction}
                          onChange={(e) =>
                            setPaymentAction(e.target.value as "collect" | "refund" | "none")
                          }
                        >
                          <FormControlLabel
                            value="collect"
                            control={<Radio />}
                            label={`Thu thêm ${totalDue > 0 ? `(${formatVND(totalDue)})` : ""}`}
                            disabled={totalDue <= 0}
                          />
                          <FormControlLabel
                            value="refund"
                            control={<Radio />}
                            label={`Hoàn lại ${totalDue < 0 ? `(${formatVND(-totalDue)})` : ""}`}
                            disabled={totalDue >= 0}
                          />
                          <FormControlLabel
                            value="none"
                            control={<Radio />}
                            label="Không thu/hoàn (bằng 0)"
                            disabled={totalDue !== 0}
                          />
                        </RadioGroup>

                        {totalDue < 0 && (
                          <Stack direction="row" spacing={1} mt={1}>
                            <Button
                              variant="outlined"
                              startIcon={<MoneyOffIcon />}
                              onClick={() => {
                                setRefundAmount(Math.abs(totalDue));
                                setRefundOpen(true);
                              }}
                            >
                              Yêu cầu hoàn tiền
                            </Button>
                            {refundRequested && <Chip size="small" color="info" label="Đã tạo refund request" />}
                          </Stack>
                        )}
                      </Box>

                      <Box>
                        <Typography variant="body2" fontWeight={600} gutterBottom>
                          Phương thức
                        </Typography>
                        <FormControl fullWidth>
                          <InputLabel>Phương thức thanh toán</InputLabel>
                          <Select
                            label="Phương thức thanh toán"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as any)}
                          >
                            <MenuItem value="cash">Tiền mặt</MenuItem>
                            <MenuItem value="card">Thẻ (POS)</MenuItem>
                            <MenuItem value="qr">QR/Bank</MenuItem>
                          </Select>
                        </FormControl>
                        {/* QR checkout flow */}
                        {paymentAction === "collect" && totalDue > 0 && paymentMethod === "qr" && (
                          <Box mt={2}>
                            <Stack spacing={1}>
                              <Button
                                variant="contained"
                                onClick={async () => {
                                  if (!selected) return;
                                  // Disable QR for partial multi-room selection (backend supports single room or whole stay)
                                  if (!selectedAll && selectedRooms.length > 1) {
                                    setActionError("QR chỉ hỗ trợ 1 phòng hoặc toàn bộ stay. Vui lòng chọn 1 phòng hoặc 'Chọn tất cả'.");
                                    return;
                                  }
                                  try {
                                    setCheckoutLoading(true);
                                    setActionError(null);
                                    const res = await createCheckoutPayment(selected.stayId, { paymentMethod: "qr", roomId: selectedAll ? undefined : selected.roomId });
                                    const info = res.checkout;
                                    setRequiresPayment(!!info.requiresPayment);
                                    setQrLink(info.vietQRLink || null);
                                    if (info.requiresPayment === false) {
                                      // nothing to pay
                                      setPaymentVerified(true);
                                    }
                                  } catch (err: any) {
                                    setActionError(err?.response?.data?.message || err?.message || "Không tạo được QR");
                                  } finally {
                                    setCheckoutLoading(false);
                                  }
                                }}
                                disabled={checkoutLoading}
                              >
                                {checkoutLoading ? "Đang tạo QR…" : "Tạo QR thanh toán"}
                              </Button>

                              {actionError && <Alert severity="error">{actionError}</Alert>}

                              {qrLink && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Quét QR để thanh toán số tiền còn thiếu.
                                  </Typography>
                                  <Box mt={1}>
                                    {/* Hiển thị như ảnh nếu là URL ảnh, nếu không vẫn để anchor */}
                                    <img src={qrLink} alt="VietQR" style={{ maxWidth: "100%", borderRadius: 8 }} onError={(e)=>{ (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                      <a href={qrLink} target="_blank" rel="noreferrer">Mở QR trong tab mới</a>
                                    </Typography>
                                  </Box>
                                </Box>
                              )}

                              {requiresPayment && (
                                <Button
                                  variant="outlined"
                                  onClick={async () => {
                                    if (!selected) return;
                                    try {
                                      setVerifyLoading(true);
                                      setActionError(null);
                                      const res = await verifyCheckoutPayment(selected.stayId);
                                      if (res?.payment?.paymentStatus && ["fully_paid"].includes(res.payment.paymentStatus)) {
                                        setPaymentVerified(true);
                                      } else if (res?.amountDue === 0) {
                                        setPaymentVerified(true);
                                      } else {
                                        setActionError("Chưa nhận được thanh toán. Vui lòng kiểm tra lại sau vài giây.");
                                      }
                                    } catch (err: any) {
                                      setActionError(err?.response?.data?.message || err?.message || "Không kiểm tra được trạng thái thanh toán");
                                    } finally {
                                      setVerifyLoading(false);
                                    }
                                  }}
                                  disabled={verifyLoading}
                                >
                                  {verifyLoading ? "Đang kiểm tra…" : "Kiểm tra thanh toán"}
                                </Button>
                              )}

                              {paymentVerified && <Alert severity="success">Đã xác nhận thanh toán đủ.</Alert>}
                              {!selectedAll && selectedRooms.length > 1 && (
                                <Alert severity="info">QR không khả dụng khi chọn một phần nhiều phòng. Hãy dùng tiền mặt/thẻ hoặc chọn 1 phòng hoặc toàn bộ.</Alert>
                              )}
                            </Stack>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* STEP 5: RETURN KEY & NOTES */}
          {activeStep === 4 && (
            <Card>
              <CardContent>
                <BlockHeader
                  icon={<VpnKeyIcon fontSize="small" />}
                  title="Trả key & ghi chú"
                  subtitle="Xác nhận đã thu hồi key thẻ/mã PIN/QR"
                />
                {!selected ? (
                  <Alert severity="warning">Vui lòng chọn khách ở bước 1.</Alert>
                ) : (
                  <>
                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                      <Chip icon={<VpnKeyIcon />} label={`Phòng ${selected.roomNumber}`} />
                      <Chip label="Key đã thu hồi" variant="outlined" />
                    </Stack>
                    <TextField
                      label="Ghi chú (nội bộ/bill)"
                      fullWidth
                      multiline
                      minRows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* STEP 6: REVIEW + EXPORT FINAL BILL */}
          {activeStep === 5 && (
            <Card>
              <CardContent>
                <BlockHeader icon={<ReceiptLongIcon fontSize="small" />} title="Xác nhận Check-out" />
                {!selected ? (
                  <Alert severity="warning">Vui lòng chọn khách ở bước 1.</Alert>
                ) : (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                      gap: 2,
                    }}
                  >
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>Thông tin khách</Typography>
                        <Row label="StayID" value={selected.stayId} />
                        <Row label="Khách" value={selected.guestName} />
                        <Row label="Phòng" value={selected.roomNumber} />
                        <Row label="Hạng" value={selected.roomType} />
                        <Row label="CI" value={selected.checkIn} />
                        <Row label="CO dự kiến" value={selected.checkOutPlan} />
                        <Row label="Giá/đêm" value={formatVND(selected.pricePerNight)} />
                        <Row label="Đã cọc" value={formatVND(deposit)} />
                      </CardContent>
                    </Card>

                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>Tóm tắt hóa đơn</Typography>
                        <Row label="Tạm tính" value={formatVND(subtotal)} />
                        <Row label="Thuế (8%)" value={formatVND(taxes)} />
                        <Row label="Cọc đã nhận" value={formatVND(deposit)} />
                        <Divider sx={{ my: 1 }} />
                        <Row
                          label={
                            totalDue > 0
                              ? "Khách cần trả thêm"
                              : totalDue < 0
                              ? "Hoàn lại khách"
                              : "Chênh lệch"
                          }
                          value={formatVND(Math.abs(totalDue))}
                        />
                        {refundRequested && <Row label="Trạng thái refund" value="Đã tạo yêu cầu" />}
                        <Divider sx={{ my: 1 }} />
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Button
                            startIcon={<PictureAsPdfIcon />}
                            variant="outlined"
                            onClick={() => setExportOpen(true)}
                          >
                            Xuất hóa đơn cuối
                          </Button>
                          {totalDue < 0 && (
                            <Button
                              startIcon={<MoneyOffIcon />}
                              variant="outlined"
                              onClick={() => {
                                setRefundAmount(Math.abs(totalDue));
                                setRefundOpen(true);
                              }}
                            >
                              Yêu cầu hoàn tiền
                            </Button>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>

                    <Box sx={{ gridColumn: "1 / -1" }}>
                      <Alert severity="info">
                        Kiểm tra kỹ danh sách khoản mục trước khi xác nhận. Bạn có thể in/email hóa đơn sau khi hoàn tất.
                      </Alert>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Box>

        {/* RIGHT: SUMMARY (sticky) */}
        <Box>
          <Card sx={{ position: { md: "sticky" }, top: { md: 84 } }}>
            <CardContent>
              <BlockHeader icon={<ReceiptLongIcon fontSize="small" />} title="Tổng kết phát sinh" />
              {selected ? (
                <>
                  <Stack spacing={0.75} sx={{ mb: 1 }}>
                    <Row label="StayID" value={selected.stayId} />
                    <Row label="Khách" value={selected.guestName} />
                    <Row label="Phòng" value={selectedRooms.length > 1 ? selectedRooms.map(r => r.roomNumber).join(', ') : selected.roomNumber} />
                    <Row label="Số phòng đã chọn" value={`${selectedRooms.length || (selected ? 1 : 0)}`} />
                    <Row label="Đêm lưu trú" value={selectedRooms.length > 1 ? `${selected.nightsSoFar} x ${selectedRooms.length} phòng` : `${selected.nightsSoFar}`} />
                    <Row label="Giá/đêm" value={selectedRooms.length > 1 ? 'Khác nhau' : formatVND(selected.pricePerNight)} />
                  </Stack>

                  <Divider sx={{ my: 1 }} />
                  <Row label="Tạm tính" value={formatVND(subtotal)} />
                  <Row label="Thuế (8%)" value={formatVND(taxes)} />
                  <Row label="Cọc áp dụng" value={formatVND(deposit)} />
                  <Divider sx={{ my: 1 }} />
                  <Row
                    label={totalDue > 0 ? "Khách cần trả thêm" : totalDue < 0 ? "Hoàn lại khách" : "Chênh lệch"}
                    value={formatVND(Math.abs(totalDue))}
                  />

                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>Nhật ký gần nhất</Typography>
                  <Stack spacing={0.5}>
                    {folio.slice(-4).map((l) => (
                      <Typography variant="caption" key={l.id}>
                        [{l.ts?.slice(0,16)}] {sourceLabel(l.source)} • {l.desc} • {l.status}
                      </Typography>
                    ))}
                  </Stack>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">Chưa chọn khách.</Typography>
              )}

              <Divider sx={{ my: 2 }} />

              <Stack direction="row" spacing={1} justifyContent="space-between">
                <Button disabled={activeStep === 0} onClick={handleBack}>Quay lại</Button>
                {activeStep < steps.length - 1 ? (
                  <Button variant="contained" disabled={!canNext} onClick={handleNext}>
                    Tiếp tục
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    disabled={!selected || (totalDue > 0 && (paymentAction !== "collect" || (paymentMethod === "qr" && (!paymentVerified || (!selectedAll && selectedRooms.length > 1)) )))}
                    onClick={async () => {
                      if (!selected) return;
                      try {
                        setActionError(null);
                        if (totalDue > 0) {
                          if (paymentAction !== "collect") {
                            setActionError("Cần chọn hành động Thu thêm cho khoản chênh lệch dương.");
                            return;
                          }
                          if (paymentMethod === "qr") {
                            if (!paymentVerified) {
                              setActionError("Chưa xác nhận thanh toán QR. Vui lòng kiểm tra thanh toán trước.");
                              return;
                            }
                            // backend đã ghi nhận thanh toán qua verify; chỉ cần confirm checkout
                            await confirmCheckout(selected.stayId, { paymentMethod: "qr", status: "Success", roomId: selectedAll ? undefined : selected.roomId });
                          } else {
                            // cash/card: nếu chọn một phần nhiều phòng, xử lý từng phòng với amountDue từng phòng
                            if (!selectedAll && selectedRooms.length > 1) {
                              for (const r of selectedRooms) {
                                // Lấy amountDue riêng cho từng phòng
                                const p = await createCheckoutPayment(selected.stayId, { paymentMethod, roomId: r.roomId });
                                const due = p.checkout?.amountDue || 0;
                                await confirmCheckout(selected.stayId, { paymentMethod, status: "Success", amountPaid: due, roomId: r.roomId });
                              }
                            } else {
                              await confirmCheckout(selected.stayId, { paymentMethod, status: "Success", amountPaid: totalDue, roomId: selectedAll ? undefined : selected.roomId });
                            }
                          }
                        } else {
                          // Không cần thu thêm: xác nhận checkout ngay
                          if (!selectedAll && selectedRooms.length > 1) {
                            for (const r of selectedRooms) {
                              await confirmCheckout(selected.stayId, { roomId: r.roomId });
                            }
                          } else {
                            await confirmCheckout(selected.stayId, { roomId: selectedAll ? undefined : selected.roomId });
                          }
                        }
                        // Sau khi thành công: refresh list và reset UI
                        await loadList(query);
                        resetAll();
                      } catch (err: any) {
                        setActionError(err?.response?.data?.message || err?.message || "Không thể xác nhận check-out");
                      }
                    }}
                  >
                    Xác nhận Check-out
                  </Button>
                )}
              </Stack>
              {actionError && (
                <Box mt={1}>
                  <Alert severity="error">{actionError}</Alert>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* DIALOGS: ADJUST */}
      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Điều chỉnh khoản mục</DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Nhập số tiền ± (âm để giảm trừ, dương để phụ thu) và lý do. Dòng điều chỉnh sẽ được lưu tách biệt.
          </Alert>
          <Stack spacing={2}>
            <TextField
              label="Số tiền điều chỉnh (VND, có thể âm)"
              type="number"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(Number(e.target.value))}
            />
            <TextField
              label="Lý do điều chỉnh"
              value={adjustNote}
              onChange={(e) => setAdjustNote(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={applyAdjust} disabled={!targetLine}>
            Áp dụng
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOGS: VOID */}
      <Dialog open={voidOpen} onClose={() => setVoidOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Huỷ khoản mục</DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Hành động sẽ đổi trạng thái khoản mục thành <b>Voided</b> và không tính vào hoá đơn.
          </Alert>
          <TextField
            fullWidth
            label="Lý do huỷ"
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVoidOpen(false)}>Đóng</Button>
          <Button color="error" variant="contained" onClick={applyVoid} disabled={!targetLine}>
            Huỷ khoản mục
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: EXPORT FINAL BILL */}
      <Dialog open={exportOpen} onClose={() => setExportOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Xuất hóa đơn cuối</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={exportIncludeCompany}
                  onChange={(e) => setExportIncludeCompany(e.target.checked)}
                />
              }
              label="Kèm thông tin công ty/thuế"
            />
            <FormControl fullWidth>
              <InputLabel>Ngôn ngữ</InputLabel>
              <Select
                label="Ngôn ngữ"
                value={exportLanguage}
                onChange={(e) => setExportLanguage(e.target.value as any)}
              >
                <MenuItem value="vi">Tiếng Việt</MenuItem>
                <MenuItem value="en">English</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Email khách (tuỳ chọn)"
              placeholder="guest@example.com"
              value={exportEmail}
              onChange={(e) => setExportEmail(e.target.value)}
            />
            <Alert severity="info">
              Đây là UI mock: nhấn các nút bên dưới để giả lập tải/in/gửi email.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button startIcon={<PictureAsPdfIcon />} onClick={() => setExportOpen(false)}>
            Tải PDF
          </Button>
          <Button startIcon={<IosShareIcon />} onClick={() => setExportOpen(false)}>
            Xuất Excel
          </Button>
          <Button startIcon={<PrintIcon />} onClick={() => setExportOpen(false)}>
            In
          </Button>
          <Button startIcon={<EmailIcon />} disabled={!exportEmail} onClick={() => setExportOpen(false)}>
            Gửi email
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: PROCESS REFUND REQUEST */}
      <Dialog open={refundOpen} onClose={() => setRefundOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Tạo yêu cầu hoàn tiền</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity="info">
              Số tiền gợi ý: <b>{formatVND(refundAmount)}</b> (có thể chỉnh).
            </Alert>
            <TextField
              label="Số tiền hoàn (VND)"
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(Number(e.target.value))}
            />
            <FormControl fullWidth>
              <InputLabel>Phương thức hoàn</InputLabel>
              <Select
                label="Phương thức hoàn"
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value as any)}
              >
                <MenuItem value="cash">Tiền mặt</MenuItem>
                <MenuItem value="card">Hoàn về thẻ (POS)</MenuItem>
                <MenuItem value="qr">Chuyển khoản/QR</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Người nhận"
              placeholder="Tên khách/đơn vị nhận hoàn"
              value={refundReceiver}
              onChange={(e) => setRefundReceiver(e.target.value)}
            />
            <TextField
              label="Thông tin (STK/last4/ref)"
              placeholder="0123456789 / **** 1234 / QR Ref..."
              value={refundInfo}
              onChange={(e) => setRefundInfo(e.target.value)}
            />
            <TextField
              label="Lý do hoàn"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundOpen(false)}>Hủy</Button>
          <Button
            variant="contained"
            startIcon={<MoneyOffIcon />}
            onClick={() => {
              // UI-only: đánh dấu đã tạo request
              setRefundRequested(true);
              setRefundOpen(false);
            }}
          >
            Tạo yêu cầu
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
      <Typography variant="body2" fontWeight={600} textAlign="right" sx={{ ml: 2 }}>
        {value}
      </Typography>
    </Stack>
  );
}
