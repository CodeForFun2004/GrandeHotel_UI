import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Chip,
  Grid,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import {
  HotelClassRounded,
  MeetingRoom,
  Business,
  Person,
  ArrowBack,
  Edit,
  UnfoldMore
} from "@mui/icons-material";
import RoomTable from "./rooms/RoomTable";

// Extended Hotel interface with more details
interface Hotel {
  id: number;
  name: string;
  address: string;
  availableRooms: number;
  totalRooms: number;
  description?: string;
  phone?: string;
  email?: string;
  managerId?: number;
}

// Mock hotels data (should be shared or fetched)
const hotels: Hotel[] = [
  {
    id: 1,
    name: "Grande Hotel Saigon",
    address: "8 Đồng Khởi, Quận 1, TP.HCM",
    availableRooms: 12,
    totalRooms: 100,
    description: "Khách sạn cao cấp nằm tại trung tâm thành phố với view đẹp ra sông Sài Gòn",
    phone: "+84 28 3823 4567",
    email: "info@grandesaigon.vn"
  },
  {
    id: 2,
    name: "Grande Hotel Hanoi",
    address: "36 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội",
    availableRooms: 5,
    totalRooms: 80,
    description: "Khách sạn sang trọng tại khu vực trung tâm Hà Nội với kiến trúc Pháp cổ điển",
    phone: "+84 24 3822 3456",
    email: "info@grandehanoi.vn"
  },
  {
    id: 3,
    name: "Grande Hotel Da Nang",
    address: "50 Bạch Đằng, Hải Châu, Đà Nẵng",
    availableRooms: 0,
    totalRooms: 120,
    description: "Khách sạn biển cao cấp với bãi biển riêng và các tiện ích nghỉ dưỡng",
    phone: "+84 236 3821 2345",
    email: "info@grandedanang.vn"
  },
];

// Mock users (managers)
const managers = [
  { id: 1, name: "David Manager", email: "david@grandehotel.vn", hotelId: 3 },
  { id: 2, name: "Alice Manager", email: "alice.manager@grandehotel.vn", hotelId: undefined },
  { id: 3, name: "Bob Manager", email: "bob.manager@grandehotel.vn", hotelId: undefined },
  { id: 4, name: "Charlie Manager", email: "charlie.manager@grandehotel.vn", hotelId: 1 },
];

const HotelDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const hotelId = parseInt(id || "0");

  const [selectedManager, setSelectedManager] = useState<number | "">("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Find current hotel
  const hotel = hotels.find(h => h.id === hotelId);

  // Find current manager
  const currentManager = managers.find(m => m.hotelId === hotelId);

  // Get available managers (not assigned to any hotel or assign new)
  const availableManagers = managers.filter(m => !m.hotelId || m.hotelId === hotelId);

  if (!hotel) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="error">
          Không tìm thấy khách sạn với ID: {hotelId}
        </Typography>
        <Button href="/admin/hotel-list" startIcon={<ArrowBack />}>
          Quay lại danh sách
        </Button>
      </Box>
    );
  }

  const handleManagerChange = (newManagerId: number | "") => {
    setSelectedManager(newManagerId);
    setConfirmDialogOpen(true);
  };

  const confirmManagerChange = () => {
    // In real app, this would update the backend
    // For now, just update local state/log
    console.log(`Assigning manager ${selectedManager} to hotel ${hotelId}`);

    // Update mock data (in real app, this would persist to backend)
    if (selectedManager === "") {
      // Unassign current manager
      const manager = managers.find(m => m.hotelId === hotelId);
      if (manager) manager.hotelId = undefined;
    } else {
      // First unassign current manager
      const currentManager = managers.find(m => m.hotelId === hotelId);
      if (currentManager) currentManager.hotelId = undefined;

      // Assign new manager
      const newManager = managers.find(m => m.id === selectedManager);
      if (newManager) newManager.hotelId = hotelId;
    }

    setConfirmDialogOpen(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with back button */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={() => window.history.back()}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" fontWeight={700} color="primary.main">
          Chi tiết khách sạn
        </Typography>
      </Box>

      {/* Hotel Basic Info */}
      <Card sx={{ mb: 3, boxShadow: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 60, height: 60 }}>
              <HotelClassRounded fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {hotel.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {hotel.address}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <Box sx={{ minWidth: 250, flex: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Thông tin liên hệ
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Điện thoại</Typography>
                <Typography variant="body1">{hotel.phone}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{hotel.email}</Typography>
              </Box>
            </Box>
            <Box sx={{ minWidth: 250, flex: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Tình trạng phòng
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Chip
                  icon={<MeetingRoom />}
                  label={`${hotel.availableRooms} / ${hotel.totalRooms} phòng trống`}
                  color={hotel.availableRooms === 0 ? "error" : hotel.availableRooms < 10 ? "warning" : "success"}
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Tỉ lệ lấp đầy: {((hotel.totalRooms - hotel.availableRooms) / hotel.totalRooms * 100).toFixed(1)}%
              </Typography>
            </Box>
          </Box>

          {hotel.description && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Mô tả
              </Typography>
              <Typography variant="body1">
                {hotel.description}
              </Typography>
            </>
          )}
        </CardContent>
      </Card>

      {/* Manager Assignment */}
      <Card sx={{ mb: 3, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Quản lý khách sạn
          </Typography>

          {currentManager ? (
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Avatar sx={{ bgcolor: 'warning.main', width: 40, height: 40 }}>
                <Business />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {currentManager.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentManager.email}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Chưa chỉ định quản lý cho khách sạn này
            </Typography>
          )}

          <FormControl fullWidth size="small" sx={{ mt: 2, maxWidth: 400 }}>
            <InputLabel>Thay đổi quản lý</InputLabel>
            <Select
              value=""
              label="Thay đổi quản lý"
              onChange={(e) => handleManagerChange(e.target.value === "" ? "" : Number(e.target.value))}
            >
              <MenuItem value="">-- Chọn quản lý --</MenuItem>
              {availableManagers.map((manager) => (
                <MenuItem
                  key={manager.id}
                  value={manager.id}
                  disabled={manager.hotelId === hotelId}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Person fontSize="small" />
                    <Box>
                      <Typography variant="body2">{manager.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {manager.email}
                      </Typography>
                    </Box>
                    {manager.hotelId === hotelId && (
                      <Chip label="Hiện tại" size="small" color="primary" />
                    )}
                  </Box>
                </MenuItem>
              ))}
              <MenuItem value="">
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  Huỷ chỉ định quản lý
                </Typography>
              </MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Rooms Section */}
      <Card sx={{ boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Danh sách phòng
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Các phòng của khách sạn {hotel.name}
          </Typography>
          <RoomTable hotelId={hotelId} canEdit={true} />
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Xác nhận thay đổi quản lý
        </DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc muốn {selectedManager === "" ? "huỷ chỉ định" : "thay đổi"} quản lý cho khách sạn {hotel.name}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Hủy</Button>
          <Button onClick={confirmManagerChange} variant="contained">
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HotelDetail;
