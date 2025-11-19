import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Stack,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import api from '../api/axios';

type Props = {
  open: boolean;
  mode: 'reserve' | 'occupy';
  roomId: string;
  roomPayload?: any;
  onClose: () => void;
  onSuccess?: (res: any) => void;
};

export default function GuestReservationWizard({ open, mode, roomId, roomPayload, onClose, onSuccess }: Props) {
  const [active, setActive] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guest info
  const [fullname, setFullname] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Booking info
  const todayStr = new Date().toISOString().slice(0, 10);
  const [checkIn, setCheckIn] = useState<string>(todayStr);
  const [checkOut, setCheckOut] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [guests, setGuests] = useState<number>(1);
  const [numRooms, setNumRooms] = useState<number>(1);
  const [isFullPayment, setIsFullPayment] = useState<boolean>(false);

  const steps = ['Khách', 'Chi tiết đặt phòng', 'Xác nhận'];

  const next = () => setActive((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setActive((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      // Build payload for reservation creation
      const hotelId = roomPayload?.hotel?._id || roomPayload?.hotel || roomPayload?.hotelId || null;
      const roomTypeId = roomPayload?.roomType?._id || roomPayload?.roomType || null;

      const payload = {
        hotelId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests: guests,
        isFullPayment,
        rooms: [
          {
            roomTypeId: roomTypeId,
            quantity: numRooms,
            adults: guests
          }
        ],
      };

      const res = await api.post('/reservations', payload);
      // Optionally, update the room status to reserved/occupied so UI stays consistent
      try {
        const statusToSet = mode === 'reserve' ? 'Reserved' : 'Occupied';
        await api.put(`/rooms/${roomId}`, { status: statusToSet });
      } catch (e) {
        console.warn('Failed to update room status after reservation/stay create', e);
      }

      onSuccess && onSuccess(res.data);
      onClose();
    } catch (err: any) {
      console.error('Reservation wizard submit failed', err);
      setError(err?.response?.data?.message || err.message || 'Gửi yêu cầu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mode === 'reserve' ? 'Tạo đặt phòng' : 'Ghi nhận check-in (Stay)'} </DialogTitle>
      <DialogContent dividers>
        <Stepper activeStep={active} alternativeLabel>
          {steps.map((s) => (
            <Step key={s}><StepLabel>{s}</StepLabel></Step>
          ))}
        </Stepper>

        <Stack spacing={2} sx={{ mt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {active === 0 && (
            <Stack spacing={2}>
              <TextField label="Họ và tên" value={fullname} onChange={(e) => setFullname(e.target.value)} fullWidth />
              <TextField label="Số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
              <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
            </Stack>
          )}

          {active === 1 && (
            <Stack spacing={2}>
              <TextField label="Check-in" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
              <TextField label="Check-out" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
              <TextField label="Số khách" type="number" value={guests} onChange={(e) => setGuests(Number(e.target.value) || 1)} fullWidth />
              <TextField label="Số phòng" type="number" value={numRooms} onChange={(e) => setNumRooms(Number(e.target.value) || 1)} fullWidth />
              <Stack direction="row" spacing={1} alignItems="center">
                <input type="checkbox" checked={isFullPayment} onChange={(e) => setIsFullPayment(e.target.checked)} />
                <Typography variant="body2">Thanh toán toàn bộ</Typography>
              </Stack>
            </Stack>
          )}

          {active === 2 && (
            <Stack spacing={1}>
              <Typography variant="subtitle1">Xác nhận</Typography>
              <Typography>Khách: {fullname || '—'} / {phone || '—'}</Typography>
              <Typography>Check-in: {checkIn} — Check-out: {checkOut}</Typography>
              <Typography>Phòng: {numRooms} | Khách: {guests}</Typography>
              <Typography>Hình thức thanh toán: {isFullPayment ? 'Toàn bộ' : 'Cọc'}</Typography>
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Hủy</Button>
        {active > 0 && <Button onClick={prev} disabled={submitting}>Quay lại</Button>}
        {active < steps.length - 1 && <Button variant="contained" onClick={next}>Tiếp</Button>}
        {active === steps.length - 1 && (
          <Button variant="contained" onClick={handleSubmit} disabled={submitting} startIcon={submitting ? <CircularProgress size={16} /> : null}>
            {mode === 'reserve' ? 'Tạo đặt phòng' : 'Ghi nhận ở'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
