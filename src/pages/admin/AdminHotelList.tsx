import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Collapse,
  IconButton
} from "@mui/material";
import {
  HotelClassRounded,
  Search,
  MeetingRoom,
  Business,
  Person,
  ExpandMore,
  ExpandLess,
  Edit
} from "@mui/icons-material";
import RoomTable from "./rooms/RoomTable";

// Extended Hotel interface với thông tin chi tiết
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

// Mock hotels data với thông tin chi tiết
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

// Mock managers data
const managers = [
  { id: 1, name: "David Manager", email: "david@grandehotel.vn", hotelId: 3 },
  { id: 2, name: "Alice Manager", email: "alice.manager@grandehotel.vn", hotelId: undefined },
  { id: 3, name: "Bob Manager", email: "bob.manager@grandehotel.vn", hotelId: undefined },
  { id: 4, name: "Charlie Manager", email: "charlie.manager@grandehotel.vn", hotelId: 1 },
];

const AdminHotelList: React.FC = () => {
  const [search, setSearch] = useState("");
  const [selectedHotelId, setSelectedHotelId] = useState<number | "">("");
  const [selectedManager, setSelectedManager] = useState<number | "">("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    hotelDetails: true,
    rooms: true
  });

  // Hotel được chọn
  const selectedHotel = hotels.find(h => h.id === selectedHotelId);

  // Filter hotels cho table
  const filteredHotels = hotels.filter(
    (hotel) =>
      hotel.name.toLowerCase().includes(search.toLowerCase()) ||
      hotel.address.toLowerCase().includes(search.toLowerCase())
  );

  // Find current manager cho hotel được chọn
  const currentManager = selectedHotel ? managers.find(m => m.hotelId === selectedHotel.id) : undefined;

  // Get available managers cho hotel được chọn
  const availableManagers = selectedHotel ? managers.filter(m => !m.hotelId || m.hotelId === selectedHotel.id) : [];

  const handleHotelSelect = (hotelId: number) => {
    setSelectedHotelId(hotelId);
    setSelectedManager("");
  };

  const handleManagerChange = (newManagerId: number | "") => {
    setSelectedManager(newManagerId);
    setConfirmDialogOpen(true);
  };

  const confirmManagerChange = () => {
    if (!selectedHotel) return;

    // Update mock data (in real app, this would persist to backend)
    if (selectedManager === "") {
      // Unassign current manager
      const manager = managers.find(m => m.hotelId === selectedHotel.id);
      if (manager) manager.hotelId = undefined;
    } else {
      // First unassign current manager
      const currentManager = managers.find(m => m.hotelId === selectedHotel.id);
      if (currentManager) currentManager.hotelId = undefined;

      // Assign new manager
      const newManager = managers.find(m => m.id === selectedManager);
      if (newManager) newManager.hotelId = selectedHotel.id;
    }

    setConfirmDialogOpen(false);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <Box sx={{ p: 3, minHeight: 'calc(100vh - 64px)' }}>
      <Typography variant="h4" gutterBottom fontWeight={700} color="primary.main">
        Quản lý khách sạn
      </Typography>

      {/* Hotel List Table */}
      <Card sx={{ mb: 3, boxShadow: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Danh sách khách sạn
            </Typography>
            <FormControl fullWidth size="small" sx={{ maxWidth: 400 }}>
              <InputLabel>Chọn khách sạn</InputLabel>
              <Select
                value={selectedHotelId || ""}
                label="Chọn khách sạn"
                onChange={(e) => handleHotelSelect(Number(e.target.value))}
              >
                <MenuItem value="">
                  <Box sx={{ opacity: 0.6 }}>
                    -- Chọn khách sạn --
                  </Box>
                </MenuItem>
                {hotels.map((hotel) => (
                  <MenuItem key={hotel.id} value={hotel.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <HotelClassRounded fontSize="small" />
                      <Box>
                        <Typography variant="body2">{hotel.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {hotel.address}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Tìm kiếm tên hoặc địa chỉ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
                style: { borderRadius: 16 }
              }}
              sx={{ width: 300 }}
            />
          </Box>
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
            <Table>
              <TableHead sx={{ background: "#f5f7fa" }}>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Khách sạn</TableCell>
                  <TableCell>Địa chỉ</TableCell>
                  <TableCell align="center">Phòng trống / Tổng phòng</TableCell>
                  <TableCell align="center">Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredHotels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                      <Typography variant="body2">Không tìm thấy khách sạn nào.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHotels.map((hotel) => (
                    <TableRow key={hotel.id} hover sx={{ transition: '0.2s' }}>
                      <TableCell>{hotel.id}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{
                            bgcolor: selectedHotel?.id === hotel.id ? 'success.main' : 'primary.main',
                            width: 36, height: 36,
                            opacity: selectedHotel?.id === hotel.id ? 1 : 0.7
                          }}>
                            <HotelClassRounded />
                          </Avatar>
                          <Typography fontWeight={selectedHotel?.id === hotel.id ? 600 : 500}>
                            {hotel.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{hotel.address}</TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<MeetingRoom />}
                          label={`${hotel.availableRooms} / ${hotel.totalRooms}`}
                          color={hotel.availableRooms === 0 ? "error" : hotel.availableRooms < 10 ? "warning" : "success"}
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant={selectedHotel?.id === hotel.id ? "contained" : "outlined"}
                          onClick={() => handleHotelSelect(hotel.id)}
                        >
                          Chọn
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Hotel Details Section */}
      {selectedHotel && (
        <>
          {/* Hotel Information and Manager Assignment */}
          <Card sx={{ mb: 3, boxShadow: 3 }}>
            <CardContent>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => toggleSection('hotelDetails')}
              >
                <Typography variant="h6" fontWeight="bold">
                  Thông tin khách sạn: {selectedHotel.name}
                </Typography>
                <IconButton size="small">
                  {expandedSections.hotelDetails ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>
              <Collapse in={expandedSections.hotelDetails}>
                <Box sx={{ mt: 2 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={3}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 60, height: 60 }}>
                      <HotelClassRounded fontSize="large" />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        {selectedHotel.name}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {selectedHotel.address}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {/* Hotel Contact Information */}
                    <Box sx={{ minWidth: 250, flex: 1, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary.main">
                        Thông tin liên hệ
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Điện thoại</Typography>
                        <Typography variant="body1">{selectedHotel.phone}</Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Email</Typography>
                        <Typography variant="body1">{selectedHotel.email}</Typography>
                      </Box>
                    </Box>
                    
                    {/* Room Status */}
                    <Box sx={{ minWidth: 250, flex: 1, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary.main">
                        Tình trạng phòng
                      </Typography>
                      <Box display="contents" alignItems="end" gap={2} mb={2}>
                        <Chip
                          icon={<MeetingRoom />}
                          label={`${selectedHotel.availableRooms} / ${selectedHotel.totalRooms} phòng trống`}
                          color={selectedHotel.availableRooms === 0 ? "error" : selectedHotel.availableRooms < 10 ? "warning" : "success"}
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>
                    </Box>
                    
                    {/* Manager Assignment Section */}
                  
                  </Box>

                  {selectedHotel.description && (
                    <>
                      <Divider sx={{ my: 3 }} />
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Mô tả
                      </Typography>
                      <Typography variant="body1">
                        {selectedHotel.description}
                      </Typography>
                    </>
                  )}
                </Box>
              </Collapse>
            </CardContent>
          </Card>

          {/* Rooms Section */}
          <Card sx={{ boxShadow: 3 }}>
            <CardContent>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => toggleSection('rooms')}
              >
                <Typography variant="h6" fontWeight="bold">
                  Danh sách phòng: {selectedHotel.name}
                </Typography>
                <IconButton size="small">
                  {expandedSections.rooms ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>
              <Collapse in={expandedSections.rooms}>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    Các phòng của khách sạn {selectedHotel.name}
                  </Typography>
                  <RoomTable hotelId={selectedHotel.id} canEdit={true} />
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        </>
      )}

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
            Bạn có chắc muốn {selectedManager === "" ? "huỷ chỉ định" : "thay đổi"} quản lý cho khách sạn {selectedHotel?.name}?
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

export default AdminHotelList;
