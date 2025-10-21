import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, CircularProgress } from "@mui/material";
import type { RoomType } from "./RoomTypeFormModal";

export type Room = {
  id?: number;
  code: string;
  name: string;
  type: string; // Changed from hardcoded to dynamic
  capacity: number;
  pricePerNight: number;
  status: "Active" | "Inactive" | "Maintenance";
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
  type: "",
  capacity: 2,
  pricePerNight: 100,
  status: "Active",
};

export default function RoomFormModal({ open, initial, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<Room>(emptyRoom);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm(initial ?? emptyRoom);
  }, [initial, open]);

  useEffect(() => {
    if (open) {
      loadRoomTypes();
    }
  }, [open]);

  const loadRoomTypes = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/room-types');
      // const data = await response.json();
      
      // Mock data for now
      const mockRoomTypes: RoomType[] = [
        { id: 1, name: "Suite", description: "Phòng suite cao cấp", basePrice: 300, maxCapacity: 4, amenities: [], isActive: true },
        { id: 2, name: "Deluxe", description: "Phòng deluxe tiện nghi", basePrice: 200, maxCapacity: 3, amenities: [], isActive: true },
        { id: 3, name: "Family", description: "Phòng gia đình", basePrice: 180, maxCapacity: 6, amenities: [], isActive: true },
        { id: 4, name: "Classic", description: "Phòng classic", basePrice: 120, maxCapacity: 2, amenities: [], isActive: true },
      ];
      
      setRoomTypes(mockRoomTypes.filter(rt => rt.isActive));
    } catch (error) {
      console.error('Error loading room types:', error);
    } finally {
      setLoading(false);
    }
  };

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
          <TextField 
            select 
            label="Loại phòng" 
            fullWidth 
            value={form.type} 
            onChange={change("type")}
            disabled={loading}
          >
            {loading ? (
              <MenuItem disabled>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  Đang tải...
                </Box>
              </MenuItem>
            ) : (
              roomTypes.map((rt) => (
                <MenuItem key={rt.id} value={rt.name}>
                  {rt.name} - ${rt.basePrice} ({rt.maxCapacity} người)
                </MenuItem>
              ))
            )}
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