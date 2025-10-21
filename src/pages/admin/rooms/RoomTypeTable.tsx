import { useMemo, useState } from "react";
import { Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Pagination, Stack } from "@mui/material";
import RoomTypeFormModal, { type RoomType } from "./RoomTypeFormModal";
import { toast } from "react-toastify";

const MOCK_ROOM_TYPES: RoomType[] = [
  { 
    id: 1, 
    name: "Suite", 
    description: "Phòng suite cao cấp với view biển", 
    basePrice: 300, 
    maxCapacity: 4, 
    amenities: ["WiFi", "TV", "Air Conditioning", "Ocean View", "Room Service"], 
    isActive: true 
  },
  { 
    id: 2, 
    name: "Deluxe", 
    description: "Phòng deluxe tiện nghi đầy đủ", 
    basePrice: 200, 
    maxCapacity: 3, 
    amenities: ["WiFi", "TV", "Air Conditioning", "Mini Bar"], 
    isActive: true 
  },
  { 
    id: 3, 
    name: "Family", 
    description: "Phòng gia đình rộng rãi", 
    basePrice: 180, 
    maxCapacity: 6, 
    amenities: ["WiFi", "TV", "Air Conditioning", "Balcony"], 
    isActive: true 
  },
  { 
    id: 4, 
    name: "Classic", 
    description: "Phòng classic tiết kiệm", 
    basePrice: 120, 
    maxCapacity: 2, 
    amenities: ["WiFi", "TV"], 
    isActive: false 
  },
];

export default function RoomTypeTable() {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>(MOCK_ROOM_TYPES);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RoomType | undefined>(undefined);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState<RoomType | undefined>(undefined);

  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filtered = useMemo(() => {
    return roomTypes.filter((rt) => {
      const matchesKw = rt.name.toLowerCase().includes(keyword.toLowerCase()) ||
                       rt.description?.toLowerCase().includes(keyword.toLowerCase());
      const matchesStatus = statusFilter === "All" || 
                           (statusFilter === "Active" && rt.isActive) ||
                           (statusFilter === "Inactive" && !rt.isActive);
      return matchesKw && matchesStatus;
    });
  }, [roomTypes, keyword, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openCreate = () => {
    setEditing(undefined);
    setModalOpen(true);
  };

  const openEdit = (roomType: RoomType) => {
    setEditing(roomType);
    setModalOpen(true);
  };

  const handleSubmit = (roomType: RoomType) => {
    if (editing) {
      setRoomTypes((prev) => prev.map((rt) => (rt.id === editing.id ? { ...roomType, id: editing.id } : rt)));
      toast.success("Cập nhật loại phòng thành công (mock)");
    } else {
      const id = Math.max(0, ...roomTypes.map((rt) => rt.id ?? 0)) + 1;
      setRoomTypes((prev) => [{ ...roomType, id }, ...prev]);
      toast.success("Thêm loại phòng thành công (mock)");
    }
    setModalOpen(false);
  };

  const askDelete = (roomType: RoomType) => {
    setDeleting(roomType);
    setConfirmOpen(true);
  };

  const doDelete = () => {
    if (!deleting) return;
    setRoomTypes((prev) => prev.filter((rt) => rt.id !== deleting.id));
    setConfirmOpen(false);
    toast.success("Xóa loại phòng thành công (mock)");
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Loại Phòng</Typography>
      <Card>
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '4fr 3fr 2fr' }, gap: 2, alignItems: 'center' }}>
            <Box>
              <TextField 
                fullWidth 
                size="small" 
                label="Tìm kiếm (tên/mô tả)" 
                value={keyword} 
                onChange={(e) => { setKeyword(e.target.value); setPage(1); }} 
              />
            </Box>
            <Box>
              <FormControl fullWidth size="small">
                <InputLabel>Trạng thái</InputLabel>
                <Select 
                  label="Trạng thái" 
                  value={statusFilter} 
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                >
                  {["All", "Active", "Inactive"].map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <Button variant="contained" onClick={openCreate} fullWidth>
                Thêm loại phòng
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <TableContainer sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tên</TableCell>
              <TableCell>Mô tả</TableCell>
              <TableCell>Giá cơ bản</TableCell>
              <TableCell>Sức chứa</TableCell>
              <TableCell>Tiện nghi</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="right">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pageData.map((rt) => (
              <TableRow key={rt.id} hover>
                <TableCell>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    {rt.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200 }}>
                    {rt.description || "Không có mô tả"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    ${rt.basePrice}
                  </Typography>
                </TableCell>
                <TableCell>{rt.maxCapacity} người</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 200 }}>
                    {rt.amenities.slice(0, 3).map((amenity, index) => (
                      <Chip 
                        key={index} 
                        label={amenity} 
                        size="small" 
                        variant="outlined"
                      />
                    ))}
                    {rt.amenities.length > 3 && (
                      <Chip 
                        label={`+${rt.amenities.length - 3}`} 
                        size="small" 
                        variant="outlined"
                        color="primary"
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    size="small" 
                    label={rt.isActive ? "Hoạt động" : "Không hoạt động"} 
                    color={rt.isActive ? "success" : "default"} 
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" onClick={() => openEdit(rt)}>
                      Sửa
                    </Button>
                    <Button size="small" color="error" onClick={() => askDelete(rt)}>
                      Xóa
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {pageData.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary">Không có dữ liệu</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
        <Pagination count={pageCount} page={page} onChange={(_, p) => setPage(p)} />
      </Box>

      <RoomTypeFormModal 
        open={modalOpen} 
        initial={editing} 
        onClose={() => setModalOpen(false)} 
        onSubmit={handleSubmit} 
      />

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Xóa loại phòng?</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn có chắc muốn xóa loại phòng "{deleting?.name}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Hủy</Button>
          <Button color="error" onClick={doDelete}>Xóa</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
