import { useState, useEffect } from "react";
import { Box, Card, CardContent, TextField, Typography, Button, Chip, Stack, CircularProgress } from "@mui/material";
import { toast } from "react-toastify";
import { getManagerHotel, updateManagerHotel } from "../../api/hotel";
import type { Hotel } from "../../types/entities";

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
  name: "",
  address: "",
  phone: "",
  email: "",
  description: "",
  amenities: [] as string[],
};

export default function HotelInfoForm() {
  const [hotel, setHotel] = useState(initialHotel);
  const [logoPreview, setLogoPreview] = useState<string | undefined>(undefined);
  const [logoFile, setLogoFile] = useState<File | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load hotel data on mount
  useEffect(() => {
    const loadHotel = async () => {
      try {
        setLoading(true);
        const response = await getManagerHotel();
        if (response.success && response.data) {
          const hotelData = response.data;
          setHotel({
            name: hotelData.name || "",
            address: hotelData.address || "",
            phone: hotelData.phone || "",
            email: hotelData.email || "",
            description: hotelData.description || "",
            amenities: hotelData.amenities || [],
          });
          // Set logo preview if images exist
          if (hotelData.images && hotelData.images.length > 0) {
            setLogoPreview(hotelData.images[0]);
          }
        }
      } catch (error: any) {
        console.error("Error loading hotel:", error);
        toast.error(error.response?.data?.message || "Không thể tải thông tin khách sạn");
      } finally {
        setLoading(false);
      }
    };
    loadHotel();
  }, []);

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
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!hotel.name || !hotel.address || !hotel.email) {
      toast.error("Vui lòng nhập tối thiểu Tên, Địa chỉ, Email");
      return;
    }

    try {
      setSaving(true);
      const images = logoFile ? [logoFile] : undefined;
      const response = await updateManagerHotel(
        {
          name: hotel.name,
          address: hotel.address,
          phone: hotel.phone,
          email: hotel.email,
          description: hotel.description,
          amenities: hotel.amenities,
        },
        images
      );

      if (response.success) {
        toast.success(response.message || "Lưu thông tin khách sạn thành công");
        setLogoFile(undefined); // Clear file after successful save
      }
    } catch (error: any) {
      console.error("Error saving hotel:", error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi lưu thông tin");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      const response = await getManagerHotel();
      if (response.success && response.data) {
        const hotelData = response.data;
        setHotel({
          name: hotelData.name || "",
          address: hotelData.address || "",
          phone: hotelData.phone || "",
          email: hotelData.email || "",
          description: hotelData.description || "",
          amenities: hotelData.amenities || [],
        });
        if (hotelData.images && hotelData.images.length > 0) {
          setLogoPreview(hotelData.images[0]);
        } else {
          setLogoPreview(undefined);
        }
        setLogoFile(undefined);
        toast.success("Đã khôi phục dữ liệu gốc");
      }
    } catch (error: any) {
      console.error("Error resetting hotel:", error);
      toast.error("Không thể khôi phục dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Hotel Information</Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'grid', gap: 2 }}>
              <TextField fullWidth label="Tên khách sạn" value={hotel.name} onChange={onChange("name")} required />
              <TextField fullWidth label="Địa chỉ" value={hotel.address} onChange={onChange("address")} required />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField fullWidth label="Điện thoại" value={hotel.phone} onChange={onChange("phone")} />
                <TextField fullWidth type="email" label="Email" value={hotel.email} onChange={onChange("email")} required />
              </Box>

              <TextField fullWidth multiline minRows={4} label="Mô tả" value={hotel.description} onChange={onChange("description")} />

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Tiện nghi</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {AMENITIES.map((a) => (
                    <Chip 
                      key={a} 
                      label={a} 
                      color={hotel.amenities.includes(a) ? "primary" : "default"} 
                      onClick={() => toggleAmenity(a)}
                      style={{ cursor: 'pointer' }}
                    />
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
                <Button variant="outlined" component="label" size="small" disabled={saving}>
                  Tải logo
                  <input type="file" accept="image/*" hidden onChange={onUploadLogo} />
                </Button>
              </Box>
            </CardContent>
          </Card>
          <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? <CircularProgress size={20} /> : "Lưu"}
            </Button>
            <Button variant="text" onClick={handleReset} disabled={saving || loading}>
              Reset
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
} 