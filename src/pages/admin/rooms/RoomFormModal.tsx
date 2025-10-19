import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box } from "@mui/material";

export type Room = {
  id?: number;
  code: string;
  name: string;
  type: "Suite" | "Deluxe" | "Family" | "Classic";
  capacity: number;
  pricePerNight: number;
  status: "Active" | "Inactive" | "Maintenance";
  hotelId?: number;
};

type Props = {
  open: boolean;
  initial?: Room;
  onClose: () => void;
  onSubmit: (room: Room) => void;
};

const emptyRoom: Room = {
  code: "",
  name: "",
  type: "Suite",
  capacity: 2,
  pricePerNight: 100,
  status: "Active",
};

export default function RoomFormModal({ open, initial, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<Room>(emptyRoom);

  useEffect(() => {
    setForm(initial ?? emptyRoom);
  }, [initial, open]);

  const change = (key: keyof Room) => (e: any) => {
    const value = key === "capacity" || key === "pricePerNight" ? Number(e.target.value) : e.target.value;
    setForm({ ...form, [key]: value } as Room);
  };

  const handleSubmit = () => {
    if (!form.code || !form.name) return;
    if (form.capacity <= 0 || form.pricePerNight <= 0) return;
    onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initial ? "Chỉnh sửa phòng" : "Thêm phòng"}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 0.5, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField label="Mã phòng" fullWidth value={form.code} onChange={change("code")} />
          <TextField label="Tên phòng" fullWidth value={form.name} onChange={change("name")} />
          <TextField select label="Loại" fullWidth value={form.type} onChange={change("type")}>
            {(["Suite", "Deluxe", "Family", "Classic"] as const).map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </TextField>
          <TextField type="number" label="Sức chứa" fullWidth value={form.capacity} onChange={change("capacity")} />
          <TextField type="number" label="Giá/đêm" fullWidth value={form.pricePerNight} onChange={change("pricePerNight")} />
          <TextField select label="Trạng thái" fullWidth value={form.status} onChange={change("status")}>
            {(["Active", "Inactive", "Maintenance"] as const).map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={handleSubmit}>Lưu</Button>
      </DialogActions>
    </Dialog>
  );
}
