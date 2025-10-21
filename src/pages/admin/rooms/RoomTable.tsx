import { useEffect, useMemo, useState } from "react";
import { Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Pagination, Stack, CircularProgress, Alert } from "@mui/material";
import RoomFormModal, { type Room as FormRoom } from "./RoomFormModal";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { fetchRooms, createRoom, updateRoom, deleteRoom, clearError } from "../../../redux/slices/roomSlice";
import { fetchRoomTypes } from "../../../redux/slices/roomTypeSlice";
import type { Room, CreateRoomPayload } from "../../../redux/slices/roomSlice";
import type { RoomType } from "../../../redux/slices/roomTypeSlice";

// Helper function to map backend status to frontend
const mapBackendStatusToFrontend = (backendStatus: string): string => {
  switch (backendStatus) {
    case 'maintenance': return 'Maintenance';
    case 'available': return 'Active';
    case 'occupied':
    case 'cleaning':
    case 'reserving':
    default: return 'Active';
  }
};

// Helper function to convert backend room to form format
const mapBackendToFormRoom = (backendRoom: Room): FormRoom => {
  return {
    id: backendRoom._id,
    code: backendRoom.roomNumber,
    name: backendRoom.roomType ? `${backendRoom.roomType.name} ${backendRoom.roomNumber}` : backendRoom.roomNumber,
    type: backendRoom.roomType?.name || '',
    capacity: backendRoom.roomType?.capacity || 0,
    pricePerNight: backendRoom.pricePerNight,
    status: mapBackendStatusToFrontend(backendRoom.status) as "Active" | "Inactive" | "Maintenance"
  };
};

// Helper function to convert form room to backend payload
const mapFormToBackendCreate = (formRoom: FormRoom, roomTypes: RoomType[], defaultHotelId: string | undefined): CreateRoomPayload | null => {
  // Find room type by name from store
  const roomType = roomTypes.find(rt => rt.name === formRoom.type);
  if (!roomType) {
    throw new Error('Room type not found');
  }

  if (!defaultHotelId) {
    return null; // Return null if no valid hotel ID
  }

  return {
    roomType: roomType.id,  // Send just the ObjectId (roomTypes have `id` field)
    hotel: defaultHotelId,  // Send just the ObjectId
    roomNumber: formRoom.code,
    status: 'available',
    pricePerNight: formRoom.pricePerNight,
    description: formRoom.name
  };
};

export default function RoomTable() {
  const dispatch = useAppDispatch();
  const { rooms, loading, error, creating, updating, deleting } = useAppSelector((state) => state.room);
  const { roomTypes } = useAppSelector((state) => state.roomType);
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FormRoom | undefined>(undefined);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState<Room | undefined>(undefined);

  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Get hotel ID from existing rooms (assuming all rooms belong to same hotel)
  const defaultHotelId = rooms.length > 0 ? rooms[0].hotel?._id || undefined : undefined;
  const hasValidHotelId = !!defaultHotelId;

  // Fetch rooms and room types on component mount
  useEffect(() => {
    dispatch(fetchRooms());
    dispatch(fetchRoomTypes());
  }, [dispatch]);

  // Debug: Log rooms data
  useEffect(() => {
    console.log('Rooms data:', rooms);
    console.log('Rooms length:', rooms.length);
    if (rooms.length > 0) {
      console.log('First room:', rooms[0]);
    }
  }, [rooms]);

  const filtered = useMemo(() => {
    // Temporary: Show all rooms for debugging
    if (keyword === "" && typeFilter === "All" && statusFilter === "All") {
      return rooms; // Show all data when no filters applied
    }

    return rooms.filter((r) => {
      const matchesKw = [r.roomNumber, r.roomType?.name, r.hotel?.name].some((v) =>
        v?.toLowerCase().includes(keyword.toLowerCase())
      );
      const matchesType = typeFilter === "All" || r.roomType?.name === typeFilter;
      const matchesStatus = statusFilter === "All" || mapBackendStatusToFrontend(r.status) === statusFilter;
      return matchesKw && matchesType && matchesStatus;
    });
  }, [rooms, keyword, typeFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openCreate = () => {
    setEditing(undefined);
    setModalOpen(true);
  };

  const openEdit = (room: Room) => {
    setEditing(mapBackendToFormRoom(room));
    setModalOpen(true);
  };

  const handleSubmit = async (formRoom: FormRoom) => {
    try {
      if (!defaultHotelId) {
        toast.error("Không thể tạo phòng - Hotel ID không hợp lệ");
        return;
      }

      if (editing) {
        // Update existing room
        const updatePayload = mapFormToBackendCreate(formRoom, roomTypes, defaultHotelId)!;
        if (updatePayload) {
          await dispatch(updateRoom({ roomId: String(editing.id) || '', roomData: updatePayload })).unwrap();
          toast.success("Cập nhật phòng thành công");
        }
      } else {
        // Create new room
        const createPayload = mapFormToBackendCreate(formRoom, roomTypes, defaultHotelId)!;
        if (createPayload) {
          await dispatch(createRoom(createPayload)).unwrap();
          toast.success("Thêm phòng thành công");
        }
      }
      setModalOpen(false);
      setEditing(undefined);
    } catch (error) {
      console.error('Room creation/update error:', error);
      toast.error("Có lỗi xảy ra");
    }
  };

  const askDelete = (room: Room) => {
    setDeletingRoom(room);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!deletingRoom?._id) return;
    try {
      await dispatch(deleteRoom(deletingRoom._id)).unwrap();
      setConfirmOpen(false);
      setDeletingRoom(undefined);
      toast.success("Xóa phòng thành công");
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleRetry = () => {
    dispatch(clearError());
    dispatch(fetchRooms());
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Rooms</Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2, alignItems: 'center' }}>
          {error}
          <Button size="small" onClick={handleRetry} sx={{ ml: 1 }}>Thử lại</Button>
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '4fr 3fr 3fr 2fr' }, gap: 2, alignItems: 'center' }}>
            <Box>
              <TextField fullWidth size="small" label="Tìm kiếm (mã/tên)" value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1); }} />
            </Box>
            <Box>
              <FormControl fullWidth size="small">
                <InputLabel>Loại phòng</InputLabel>
                <Select label="Loại phòng" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
                  <MenuItem value="All">All</MenuItem>
                  {roomTypes.map((rt) => (
                    <MenuItem key={rt.id} value={rt.name}>{rt.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <FormControl fullWidth size="small">
                <InputLabel>Trạng thái</InputLabel>
                <Select label="Trạng thái" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                  {["All", "Active", "Inactive", "Maintenance"].map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box>
              <Button variant="contained" onClick={openCreate} fullWidth disabled={creating}>Thêm phòng</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <TableContainer sx={{ mt: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Đang tải...</Typography>
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mã</TableCell>
                <TableCell>Tên</TableCell>
                <TableCell>Loại</TableCell>
                <TableCell>Sức chứa</TableCell>
                <TableCell>Giá/đêm</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell align="right">Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageData.map((r) => (
                <TableRow key={r._id} hover>
                  <TableCell>{r.roomNumber}</TableCell>
                  <TableCell>{r.roomType?.name} {r.roomNumber}</TableCell>
                  <TableCell>{r.roomType?.name}</TableCell>
                  <TableCell>{r.roomType?.capacity}</TableCell>
                  <TableCell>${r.pricePerNight}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={mapBackendStatusToFrontend(r.status)}
                      color={mapBackendStatusToFrontend(r.status) === "Active" ? "success" : mapBackendStatusToFrontend(r.status) === "Inactive" ? "default" : "warning"}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        onClick={() => openEdit(r)}
                        disabled={creating || updating || deleting}
                      >
                        Sửa
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => askDelete(r)}
                        disabled={creating || updating || deleting}
                      >
                        Xóa
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {pageData.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary">Không có dữ liệu</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
        <Pagination count={pageCount} page={page} onChange={(_, p) => setPage(p)} />
      </Box>

      <RoomFormModal open={modalOpen} initial={editing} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} />

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Xóa phòng?</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc muốn xóa phòng {deletingRoom?.roomNumber}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Hủy</Button>
          <Button color="error" onClick={doDelete} disabled={deleting}>Xóa</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
