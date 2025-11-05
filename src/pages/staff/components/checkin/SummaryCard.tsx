import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Divider,
  Button,
} from "@mui/material";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import { BlockHeader } from "./BlockHeader";
import { Row } from "./Row";
import { formatVND } from "./utils";

// Local interface to avoid importing from dashboard
interface SelectedBooking {
  customer?: {
    fullname?: string;
  };
  hotel?: {
    name?: string;
  };
  checkInDate: string;
  checkOutDate: string;
  paymentStatus: string;
}

interface SummaryCardProps {
  selected: SelectedBooking | null;
  paymentSummary: {
    paymentStatus: string;
    totalPrice: number;
    depositAmount: number;
    paidAmount: number;
  } | null;
  totalNights: number;
  activeStep: number;
  canNext: boolean;
  isLastStep: boolean;
  onBack: () => void;
  onNext: () => void;
  onConfirm: () => void;
  confirmDisabled: boolean;
  confirmLabel?: string;
}

export function SummaryCard({
  selected,
  paymentSummary,
  totalNights,
  activeStep,
  canNext,
  isLastStep,
  onBack,
  onNext,
  onConfirm,
  confirmDisabled,
  confirmLabel = "Xác nhận Check-in",
}: SummaryCardProps) {
  const totalPrice = paymentSummary?.totalPrice ?? 0;
  const depositAmount = paymentSummary?.depositAmount ?? 0;
  const paidAmount = paymentSummary?.paidAmount ?? 0;
  const remainingAmount = Math.max(0, totalPrice - paidAmount);

  return (
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
              value={new Date(selected.checkInDate).toLocaleDateString("vi-VN")}
            />
            <Row
              label="Check-out"
              value={new Date(selected.checkOutDate).toLocaleDateString("vi-VN")}
            />
            <Row label="Số đêm" value={`${totalNights}`} />
            <Row
              label="Payment"
              value={paymentSummary?.paymentStatus || selected.paymentStatus}
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
          <Button disabled={activeStep === 0} onClick={onBack}>
            Quay lại
          </Button>
          {!isLastStep ? (
            <Button variant="contained" disabled={!canNext} onClick={onNext}>
              Tiếp tục
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              disabled={confirmDisabled}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

