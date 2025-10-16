import { useMemo, useState } from "react";
import { Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Pagination, Stack } from "@mui/material";
import RoomFormModal, { type Room } from "./RoomFormModal";
import { toast } from "react-toastify";

const MOCK_ROOMS: Room[] = [
  { id: 1, code: "A101", name: "Suite Ocean", type: "Suite", capacity: 3, pricePerNight: 220, status: "Active" },
  { id: 2, code: "B203", name: "Deluxe Garden", type: "Deluxe", capacity: 2, pricePerNight: 180, status: "Active" },
  { id: 3, code: "C305", name: "Family City", type: "Family", capacity: 5, pricePerNight: 200, status: "Inactive" },
  { id: 4, code: "D107", name: "Classic Cozy", type: "Classic", capacity: 2, pricePerNight: 150, status: "Maintenance" },
];

export default function RoomTable() {
  const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS);
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Room | undefined>(undefined);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState<Room | undefined>(undefined);

  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filtered = useMemo(() => {
    return rooms.filter((r) => {
      const matchesKw = [r.code, r.name].some((v) => v.toLowerCase().includes(keyword.toLowerCase()));
      const matchesType = typeFilter === "All" || r.type === (typeFilter as any);
      const matchesStatus = statusFilter === "All" || r.status === (statusFilter as any);
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
    setEditing(room);
    setModalOpen(true);
  };

  const handleSubmit = (room: Room) => {
    if (editing) {
      setRooms((prev) => prev.map((r) => (r.id === editing.id ? { ...room, id: editing.id } : r)));
      toast.success("Cập nhật phòng thành công (mock)");
    } else {
      const id = Math.max(0, ...rooms.map((r) => r.id ?? 0)) + 1;
      setRooms((prev) => [{ ...room, id }, ...prev]);
      toast.success("Thêm phòng thành công (mock)");
    }
    setModalOpen(false);
  };

  const askDelete = (room: Room) => {
    setDeleting(room);
    setConfirmOpen(true);
  };

  const doDelete = () => {
    if (!deleting) return;
    setRooms((prev) => prev.filter((r) => r.id !== deleting.id));
    setConfirmOpen(false);
    toast.success("Xóa phòng thành công (mock)");
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Rooms</Typography>
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
                  {["All", "Suite", "Deluxe", "Family", "Classic"].map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
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
              <Button variant="contained" onClick={openCreate} fullWidth>Thêm phòng</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <TableContainer sx={{ mt: 2 }}>
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
              <TableRow key={r.id} hover>
                <TableCell>{r.code}</TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.type}</TableCell>
                <TableCell>{r.capacity}</TableCell>
                <TableCell>${r.pricePerNight}</TableCell>
                <TableCell>
                  <Chip size="small" label={r.status} color={r.status === "Active" ? "success" : r.status === "Inactive" ? "default" : "warning"} />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button size="small" onClick={() => openEdit(r)}>Sửa</Button>
                    <Button size="small" color="error" onClick={() => askDelete(r)}>Xóa</Button>
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

      <RoomFormModal open={modalOpen} initial={editing} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} />

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Xóa phòng?</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc muốn xóa phòng {deleting?.code}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Hủy</Button>
          <Button color="error" onClick={doDelete}>Xóa</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 