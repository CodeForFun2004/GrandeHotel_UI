import { useMemo, useState, useEffect } from "react";
import { Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Pagination, Stack } from "@mui/material";
import RoomTypeFormModal, { type RoomType } from "./RoomTypeFormModal";
import type { RoomType as ReduxRoomType } from "../../../redux/slices/roomTypeSlice";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { fetchRoomTypes, createRoomType, updateRoomType, deleteRoomType } from "../../../redux/slices/roomTypeSlice";
import type { CreateRoomTypePayload, UpdateRoomTypePayload } from "../../../redux/slices/roomTypeSlice";
import { formatVND } from "../../../utils/formatCurrency";



export default function RoomTypeTable() {
  const dispatch = useAppDispatch();
  const { roomTypes } = useAppSelector((state) => state.roomType);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RoomType | undefined>(undefined);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingRoomType, setDeletingRoomType] = useState<ReduxRoomType | undefined>(undefined);

  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Fetch room types from API
  useEffect(() => {
    dispatch(fetchRoomTypes());
  }, [dispatch]);

  const filtered = useMemo(() => {
    return roomTypes.filter((rt) => {
      const matchesKw = rt.name.toLowerCase().includes(keyword.toLowerCase()) ||
                       rt.description?.toLowerCase().includes(keyword.toLowerCase());
      // Filter by isActive status
      const matchesStatus = statusFilter === "All" || 
                          (statusFilter === "Active" && rt.isActive !== false) ||
                          (statusFilter === "Inactive" && rt.isActive === false);
      return matchesKw && matchesStatus;
    });
  }, [roomTypes, keyword, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openCreate = () => {
    setEditing(undefined);
    setModalOpen(true);
  };

  const openEdit = (roomType: ReduxRoomType) => {
    // Convert ReduxRoomType to RoomType (form modal expects RoomType with optional id)
    const formRoomType: RoomType = {
      id: roomType.id,
      name: roomType.name,
      description: roomType.description,
      basePrice: roomType.basePrice,
      capacity: roomType.capacity,
      numberOfBeds: roomType.numberOfBeds,
      amenities: roomType.amenities,
      isActive: roomType.isActive,
    };
    setEditing(formRoomType);
    setModalOpen(true);
  };

  const handleToggleStatus = async (roomType: ReduxRoomType) => {
    try {
      const updatePayload: UpdateRoomTypePayload = {
        isActive: !roomType.isActive,
      };
      await dispatch(updateRoomType({ roomTypeId: roomType.id, roomTypeData: updatePayload })).unwrap();
      toast.success(`Đã ${roomType.isActive ? 'vô hiệu hóa' : 'kích hoạt'} loại phòng thành công`);
    } catch (error) {
      console.error('Toggle status error:', error);
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleSubmit = async (roomType: RoomType) => {
    try {
      if (editing) {
        // Update existing room type
        const updatePayload: UpdateRoomTypePayload = {
          name: roomType.name,
          description: roomType.description,
          basePrice: roomType.basePrice,
          capacity: roomType.capacity,
          numberOfBeds: roomType.numberOfBeds,
          amenities: roomType.amenities,
          isActive: roomType.isActive,
        };
        await dispatch(updateRoomType({ roomTypeId: editing.id!, roomTypeData: updatePayload })).unwrap();
        toast.success("Cập nhật loại phòng thành công");
      } else {
        // Create new room type
        const createPayload: CreateRoomTypePayload = {
          name: roomType.name,
          description: roomType.description,
          basePrice: roomType.basePrice,
          capacity: roomType.capacity,
          numberOfBeds: roomType.numberOfBeds,
          amenities: roomType.amenities,
          isActive: roomType.isActive,
        };
        await dispatch(createRoomType(createPayload)).unwrap();
        toast.success("Thêm loại phòng thành công");
      }
      setModalOpen(false);
      setEditing(undefined);
    } catch (error) {
      console.error('Room type operation error:', error);
      toast.error("Có lỗi xảy ra");
    }
  };

  const askDelete = (roomType: ReduxRoomType) => {
    setDeletingRoomType(roomType);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!deletingRoomType) return;
    try {
      await dispatch(deleteRoomType(deletingRoomType.id)).unwrap();
      setConfirmOpen(false);
      setDeletingRoomType(undefined);
      toast.success("Xóa loại phòng thành công");
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    }
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
              <TableCell>Số giường</TableCell>
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
                    {formatVND(rt.basePrice)}
                  </Typography>
                </TableCell>
                <TableCell>{rt.capacity} người</TableCell>
                <TableCell>{rt.numberOfBeds} giường</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={rt.isActive !== false ? "Hoạt động" : "Không hoạt động"}
                    color={rt.isActive !== false ? "success" : "default"}
                    onClick={() => handleToggleStatus(rt)}
                    style={{ cursor: 'pointer' }}
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
            Bạn có chắc muốn xóa loại phòng "{deletingRoomType?.name}"?
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
