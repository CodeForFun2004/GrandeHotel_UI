import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, FormControlLabel, Switch, Chip, Autocomplete, Typography } from "@mui/material";

export type RoomType = {
  id?: string;
  name: string;
  description?: string;
  basePrice: number;
  capacity: number;
  numberOfBeds: number;
  amenities?: string[];
  isActive?: boolean;
};

type Props = {
  open: boolean;
  initial?: RoomType;
  onClose: () => void;
  onSubmit: (roomType: RoomType) => void;
};

const emptyRoomType: RoomType = {
  name: "",
  description: "",
  basePrice: 100,
  capacity: 2,
  numberOfBeds: 1,
  amenities: [],
  isActive: true,
};

const commonAmenities = [
  "WiFi", "TV", "Air Conditioning", "Mini Bar", "Safe", "Balcony", 
  "Ocean View", "City View", "Room Service", "Laundry", "Spa Access",
  "Gym Access", "Pool Access", "Breakfast", "Parking"
];

export default function RoomTypeFormModal({ open, initial, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<RoomType>(emptyRoomType);
  const [amenitiesInput, setAmenitiesInput] = useState<string>("");

  useEffect(() => {
    setForm(initial ?? emptyRoomType);
    setAmenitiesInput("");
  }, [initial, open]);

  const change = (key: keyof RoomType) => (e: any) => {
    let value: any;
    if (key === "basePrice" || key === "capacity" || key === "numberOfBeds") {
      // Remove leading zeros and convert to number
      const inputValue = e.target.value.toString().replace(/^0+/, '') || '0';
      value = Number(inputValue);
      // Prevent negative numbers
      if (value < 0) value = 0;
    } else {
      value = e.target.value;
    }
    setForm({ ...form, [key]: value } as RoomType);
  };

  const handleAmenitiesChange = (event: any, newValue: string[]) => {
    setForm({ ...form, amenities: newValue || [] });
  };

  const addCustomAmenity = () => {
    if (amenitiesInput.trim() && !(form.amenities || []).includes(amenitiesInput.trim())) {
      setForm({
        ...form,
        amenities: [...(form.amenities || []), amenitiesInput.trim()]
      });
      setAmenitiesInput("");
    }
  };

  const removeAmenity = (amenity: string) => {
    setForm({
      ...form,
      amenities: (form.amenities || []).filter(a => a !== amenity)
    });
  };

  const handleSubmit = () => {
    if (!form.name || form.basePrice <= 0 || form.capacity <= 0) {
      return;
    }
    onSubmit(form);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{initial ? "Chỉnh sửa loại phòng" : "Thêm loại phòng"}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField 
            label="Tên loại phòng" 
            fullWidth 
            value={form.name} 
            onChange={change("name")}
            required
          />
          <TextField 
            type="number" 
            label="Giá cơ bản (VNĐ)" 
            fullWidth 
            value={form.basePrice || ''} 
            onChange={change("basePrice")}
            inputProps={{ min: 0, step: 1000 }}
            required
          />
          <TextField
            type="number"
            label="Sức chứa tối đa"
            fullWidth
            value={form.capacity}
            onChange={change("capacity")}
            required
          />
          <TextField
            type="number"
            label="Số giường"
            fullWidth
            value={form.numberOfBeds}
            onChange={change("numberOfBeds")}
            required
          />
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
              }
              label="Hoạt động"
            />
          </Box>
        </Box>

        <TextField 
          label="Mô tả" 
          fullWidth 
          multiline 
          rows={3}
          value={form.description} 
          onChange={change("description")}
          sx={{ mt: 2 }}
        />

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Tiện nghi</Typography>
          
          <Autocomplete
            multiple
            freeSolo
            options={commonAmenities}
            value={form.amenities}
            onChange={handleAmenitiesChange}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...chipProps } = getTagProps({ index });
                return (
                  <Chip
                    key={key}
                    variant="outlined"
                    label={option}
                    {...chipProps}
                    onDelete={() => removeAmenity(option)}
                  />
                );
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Chọn tiện nghi"
                placeholder="Nhập hoặc chọn tiện nghi"
              />
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={handleSubmit}>Lưu</Button>
      </DialogActions>
    </Dialog>
  );
}
