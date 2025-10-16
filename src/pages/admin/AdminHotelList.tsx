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
  InputAdornment
} from "@mui/material";
import { HotelClassRounded, Search, MeetingRoom } from "@mui/icons-material";

// Kiểu dữ liệu khách sạn
interface Hotel {
  id: number;
  name: string;
  address: string;
  availableRooms: number;
  totalRooms: number;
}

// Mock data mẫu
const hotels: Hotel[] = [
  { id: 1, name: "Grande Hotel Saigon", address: "8 Đồng Khởi, Quận 1, TP.HCM", availableRooms: 12, totalRooms: 100 },
  { id: 2, name: "Grande Hotel Hanoi", address: "36 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội", availableRooms: 5, totalRooms: 80 },
  { id: 3, name: "Grande Hotel Da Nang", address: "50 Bạch Đằng, Hải Châu, Đà Nẵng", availableRooms: 0, totalRooms: 120 },
];

const AdminHotelList: React.FC = () => {
  const [search, setSearch] = useState("");

  const filteredHotels = hotels.filter(
    (hotel) =>
      hotel.name.toLowerCase().includes(search.toLowerCase()) ||
      hotel.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700} color="primary.main">
        Danh sách khách sạn
      </Typography>
      <Box mb={2} display="flex" justifyContent="flex-end">
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
        />
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3 }}>
        <Table>
          <TableHead sx={{ background: "#f5f7fa" }}>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Khách sạn</TableCell>
              <TableCell>Địa chỉ</TableCell>
              <TableCell align="center">Phòng trống / Tổng phòng</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredHotels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary' }}>
                  Không tìm thấy khách sạn nào.
                </TableCell>
              </TableRow>
            ) : (
              filteredHotels.map((hotel) => (
                <TableRow key={hotel.id} hover sx={{ transition: '0.2s', '&:hover': { background: '#f0f4ff' } }}>
                  <TableCell>{hotel.id}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                        <HotelClassRounded />
                      </Avatar>
                      <Typography fontWeight={500}>{hotel.name}</Typography>
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AdminHotelList;
