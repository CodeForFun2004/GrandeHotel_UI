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
type RoomType = "Standard" | "Deluxe" | "Suite";
type LineStatus = "POSTED" | "VOIDED" | "ADJUSTED";
type LineSource = "WEB_ADDON" | "MINIBAR" | "POS" | "FRONTDESK" | "INSPECTION";

type InHouse = {
  stayId: string;              // Mã StayID dùng xuyên suốt
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

// Mock danh sách khách đang ở
const IN_HOUSE: InHouse[] = [
  {
    stayId: "STAY001",
    guestName: "Nguyen A",
    phone: "0900000001",
    email: "a@example.com",
    roomType: "Deluxe",
    roomNumber: "507",
    checkIn: "2025-10-18 14:15",
    checkOutPlan: "2025-10-20 12:00",
    pricePerNight: 2_800_000,
    nightsSoFar: 2,
    deposit: 2_000_000,
  },
  {
    stayId: "STAY002",
    guestName: "Tran B",
    phone: "0900000002",
    email: "b@example.com",
    roomType: "Standard",
    roomNumber: "202",
    checkIn: "2025-10-18 13:40",
    checkOutPlan: "2025-10-19 12:00",
    pricePerNight: 1_200_000,
    nightsSoFar: 1,
    deposit: 500_000,
  },
];

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
  const [selected, setSelected] = useState<InHouse | null>(null);

  const filtered = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return IN_HOUSE.filter(
      (s) =>
        s.stayId.toLowerCase().includes(q) ||
        s.roomNumber.includes(q) ||
        s.guestName.toLowerCase().includes(q) ||
        s.phone.includes(q)
    );
  }, [query]);

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

  const pickStay = (stay: InHouse) => {
    const base = initRoomLines(stay);
    // Ưu tiên sử dụng prepostedServices từ booking nếu có, nếu không thì dùng PREPOSTED_LINES mock
    const pre = stay.prepostedServices || PREPOSTED_LINES[stay.stayId] || [];
    setFolio([...base, ...pre]);
    setSelected(stay);
    setNote("");
    setLateCheckout("none");
    setDamageFee(0);
    setLostKey(false);
    setPaymentAction("none");
    setRefundRequested(false);
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

  /** Derived totals (chỉ tính các dòng không VOided) */
  const effectiveLines = useMemo(
    () => folio.filter((l) => l.status !== "VOIDED"),
    [folio]
  );

  const subtotal = useMemo(
    () => effectiveLines.reduce((sum, it) => sum + it.amount * it.qty, 0),
    [effectiveLines]
  );

  const deposit = selected?.deposit ?? 0;
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

  // Auto-select stay nếu được truyền từ StaffBookings (đặt sau khi tất cả states đã setup)
  useEffect(() => {
    if (passedStayData && !selected) {
      // Thêm vào mock list nếu chưa có
      const existing = IN_HOUSE.find((s) => s.stayId === passedStayData.stayId);
      if (!existing) {
        IN_HOUSE.push(passedStayData);
      }
      // Auto-select và load folio
      pickStay(passedStayData);
      setQuery(passedStayData.stayId);
      // Tự động chuyển sang bước review (bước 2)
      setActiveStep(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passedStayData]);

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
                  />
                  <Button variant="contained">Tìm</Button>
                </Stack>

                <Table size="small" sx={{ mt: 2 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>StayID</TableCell>
                      <TableCell>Khách</TableCell>
                      <TableCell>Phòng</TableCell>
                      <TableCell>Hạng</TableCell>
                      <TableCell>CI</TableCell>
                      <TableCell>CO (dự kiến)</TableCell>
                      <TableCell>Giá/đêm</TableCell>
                      <TableCell align="right">Chọn</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((s) => (
                      <TableRow key={s.stayId} hover selected={selected?.stayId === s.stayId}>
                        <TableCell>{s.stayId}</TableCell>
                        <TableCell>{s.guestName}</TableCell>
                        <TableCell>{s.roomNumber}</TableCell>
                        <TableCell>{s.roomType}</TableCell>
                        <TableCell>{s.checkIn}</TableCell>
                        <TableCell>{s.checkOutPlan}</TableCell>
                        <TableCell>{formatVND(s.pricePerNight)}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={() => pickStay(s)}
                            variant={selected?.stayId === s.stayId ? "contained" : "outlined"}
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
                            Nhập từ khóa để tìm khách đang ở.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {query && filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <Alert severity="warning">Không tìm thấy.</Alert>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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
                    <Row label="Phòng" value={selected.roomNumber} />
                    <Row label="Đêm lưu trú" value={`${selected.nightsSoFar}`} />
                    <Row label="Giá/đêm" value={formatVND(selected.pricePerNight)} />
                  </Stack>

                  <Divider sx={{ my: 1 }} />
                  <Row label="Tạm tính" value={formatVND(subtotal)} />
                  <Row label="Thuế (8%)" value={formatVND(taxes)} />
                  <Row label="Cọc đã nhận" value={formatVND(deposit)} />
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
                    disabled={!selected}
                    onClick={() => {
                      // UI-only: reset sau khi confirm
                      resetAll();
                    }}
                  >
                    Xác nhận Check-out
                  </Button>
                )}
              </Stack>
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
