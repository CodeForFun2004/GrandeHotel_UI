import { useState } from "react";
import { Box, Card, CardContent, TextField, Typography, Button, Chip, Stack } from "@mui/material";
import { toast } from "react-toastify";

const AMENITIES = [
  "Free Wi-Fi",
  "Swimming Pool",
  "Spa",
  "Restaurant",
  "Gym",
  "Airport Shuttle",
  "Parking",
];

const initialHotel = {
  name: "Grande Hotel",
  address: "203 Fake St. Mountain View, San Francisco, CA",
  phone: "+1 222 333 444",
  email: "info@grandhotel.com",
  description: "Khách sạn 5* giữa trung tâm thành phố.",
  amenities: ["Free Wi-Fi", "Restaurant", "Spa"],
  logoUrl: "",
};

export default function HotelInfoForm() {
  const [hotel, setHotel] = useState(initialHotel);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(undefined);

  const onChange = (key: keyof typeof initialHotel) => (e: any) => {
    setHotel({ ...hotel, [key]: e.target.value });
  };

  const toggleAmenity = (amenity: string) => {
    setHotel((h) => {
      const has = h.amenities.includes(amenity);
      return { ...h, amenities: has ? h.amenities.filter((a) => a !== amenity) : [...h.amenities, amenity] };
    });
  };

  const onUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!hotel.name || !hotel.address || !hotel.email) {
      toast.error("Vui lòng nhập tối thiểu Tên, Địa chỉ, Email");
      return;
    }
    toast.success("Lưu thông tin khách sạn thành công (mock)");
  };

  const handleReset = () => {
    setHotel(initialHotel);
    setLogoPreview(undefined);
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Hotel Information</Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'grid', gap: 2 }}>
              <TextField fullWidth label="Tên khách sạn" value={hotel.name} onChange={onChange("name")} />
              <TextField fullWidth label="Địa chỉ" value={hotel.address} onChange={onChange("address")} />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField fullWidth label="Điện thoại" value={hotel.phone} onChange={onChange("phone")} />
                <TextField fullWidth type="email" label="Email" value={hotel.email} onChange={onChange("email")} />
              </Box>

              <TextField fullWidth multiline minRows={4} label="Mô tả" value={hotel.description} onChange={onChange("description")} />

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Tiện nghi</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {AMENITIES.map((a) => (
                    <Chip key={a} label={a} color={hotel.amenities.includes(a) ? "primary" : "default"} onClick={() => toggleAmenity(a)} />
                  ))}
                </Stack>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Box>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Logo</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {logoPreview ? (
                  <img src={logoPreview} alt="logo" style={{ width: 160, height: 160, objectFit: "cover", borderRadius: 8 }} />
                ) : (
                  <Box sx={{ width: 160, height: 160, background: "#f2f2f2", borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "text.secondary" }}>No Logo</Box>
                )}
                <Button variant="outlined" component="label" size="small">
                  Tải logo
                  <input type="file" accept="image/*" hidden onChange={onUploadLogo} />
                </Button>
              </Box>
            </CardContent>
          </Card>
          <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
            <Button variant="contained" onClick={handleSave}>Lưu</Button>
            <Button variant="text" onClick={handleReset}>Reset</Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
} 