import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  Paper,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  IconButton,
  Tooltip,
  Pagination,
} from "@mui/material";
import {
  Search,
  CheckCircle,
  Cancel,
  Assignment,
  Visibility,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../redux/store";
import { fetchContacts, updateContact } from "../../redux/slices/contactSlice";
import type { Contact } from "../../types/entities";

const STATUS_CONFIG = {
  pending: { label: "Chưa xử lý", color: "warning" as const, icon: <Assignment /> },
  processed: { label: "Đã xử lý", color: "success" as const, icon: <CheckCircle /> },
  ignored: { label: "Bỏ qua", color: "error" as const, icon: <Cancel /> },
};

const STATUS_FLOW = {
  pending: ["processed", "ignored"],
  processed: ["ignored"],
  ignored: ["processed"],
};

export default function ContactManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const { contacts, loading } = useSelector((state: RootState) => state.contacts);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [actionDialog, setActionDialog] = useState(false);
  const [actionType, setActionType] = useState<string>("");
  const [detailsDialog, setDetailsDialog] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchContacts());
  }, [dispatch]);

  // Filter contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact: Contact) => {
      const matchesSearch =
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.phone && contact.phone.includes(searchTerm));

      const matchesStatus = statusFilter === "all" || contact.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [contacts, searchTerm, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredContacts.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (_event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (event: any) => {
    setRowsPerPage(Number(event.target.value));
    setPage(1); // Reset to first page
  };

  // Get available actions for a contact
  const getAvailableActions = (contact: Contact) => {
    return STATUS_FLOW[contact.status || "pending"] || STATUS_FLOW.pending;
  };

  // Handle status change
  const handleStatusChange = async (contactId: string, newStatus: string) => {
    try {
      await dispatch(updateContact({
        id: contactId,
        payload: { status: newStatus as Contact['status'] }
      }));
      setActionDialog(false);
      setSelectedContact(null);
    } catch (error) {
      console.error("Failed to update contact status:", error);
    }
  };

  // Open action dialog
  const openActionDialog = (contact: Contact, action: string) => {
    setSelectedContact(contact);
    setActionType(action);
    setActionDialog(true);
  };

  // Open details dialog
  const openDetailsDialog = (contact: Contact) => {
    setSelectedContact(contact);
    setDetailsDialog(true);
  };

  // Get status color
  const getStatusColor = (status: Contact['status']) => {
    return STATUS_CONFIG[status || "pending"]?.color || "secondary";
  };

  // Get status label
  const getStatusLabel = (status: Contact['status']) => {
    return STATUS_CONFIG[status || "pending"]?.label || "Chưa xử lý";
  };

  if (loading && contacts.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Loading contacts...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700} color="primary.main">
        Quản lý liên hệ
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
            <TextField
              fullWidth
              size="small"
              label="Tìm kiếm (tên, email, số điện thoại)"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1); // Reset to first page when searching
              }}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: "text.secondary" }} />,
              }}
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1); // Reset to first page when filtering
                }}
                label="Trạng thái"
              >
                <MenuItem value="all">Tất cả</MenuItem>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <MenuItem key={key} value={key}>
                    {config.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <TableContainer component={Paper}>
        <Table sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '20%' }}>Tên</TableCell>
              <TableCell sx={{ width: '25%' }}>Email</TableCell>
              <TableCell sx={{ width: '15%' }}>Số điện thoại</TableCell>
              <TableCell sx={{ width: '15%' }}>Trạng thái</TableCell>
              <TableCell align="center" sx={{ minWidth: 200, width: 200 }}>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedContacts.map((contact) => {
              const availableActions = getAvailableActions(contact);

              return (
                <TableRow key={contact._id || contact.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {contact.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {contact.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {contact.phone || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(contact.status)}
                      color={getStatusColor(contact.status)}
                      size="small"
                      icon={STATUS_CONFIG[contact.status || "pending"]?.icon}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ minWidth: 200 }}>
                    <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                      {availableActions.map((action) => (
                        <Tooltip key={action} title={STATUS_CONFIG[action as keyof typeof STATUS_CONFIG]?.label}>
                          <Button
                            size="small"
                            variant="outlined"
                            color={getStatusColor(action as Contact['status'])}
                            onClick={() => openActionDialog(contact, action)}
                            startIcon={STATUS_CONFIG[action as keyof typeof STATUS_CONFIG]?.icon}
                            sx={{
                              minWidth: 100,
                              height: 32,
                              fontSize: '0.75rem',
                              textTransform: 'none',
                              fontWeight: 500,
                            }}
                          >
                            {getStatusLabel(action as Contact['status'])}
                          </Button>
                        </Tooltip>
                      ))}
                      <Tooltip title="Xem chi tiết">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => openDetailsDialog(contact)}
                          sx={{
                            width: 32,
                            height: 32,
                            ml: 0.5
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
            {paginatedContacts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary">
                    Không có dữ liệu
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Controls */}
      {filteredContacts.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredContacts.length)} trong {filteredContacts.length} kết quả
            </Typography>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                displayEmpty
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">
              dòng/trang
            </Typography>
          </Box>

          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
            size="small"
          />
        </Box>
      )}

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialog} onClose={() => setActionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Xác nhận thay đổi trạng thái
        </DialogTitle>
        <DialogContent>
          {selectedContact && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Bạn có chắc chắn muốn thay đổi trạng thái liên hệ của <strong>{selectedContact.name}</strong>?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Từ: <Chip label={getStatusLabel(selectedContact.status)} color={getStatusColor(selectedContact.status)} size="small" />
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Thành: <Chip label={STATUS_CONFIG[actionType as keyof typeof STATUS_CONFIG]?.label} color={getStatusColor(actionType as Contact['status'])} size="small" />
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(false)}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color={getStatusColor(actionType as Contact['status'])}
            onClick={() => selectedContact && handleStatusChange(selectedContact._id || selectedContact.id || "", actionType)}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>

      {/* Contact Details Dialog */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Chi tiết liên hệ
        </DialogTitle>
        <DialogContent>
          {selectedContact && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Thông tin liên hệ
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">Tên:</Typography>
                <Typography variant="body1">{selectedContact.name}</Typography>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">Email:</Typography>
                <Typography variant="body1">{selectedContact.email}</Typography>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">Số điện thoại:</Typography>
                <Typography variant="body1">{selectedContact.phone || "Chưa cung cấp"}</Typography>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">Trạng thái:</Typography>
                <Chip
                  label={getStatusLabel(selectedContact.status)}
                  color={getStatusColor(selectedContact.status)}
                  size="small"
                  icon={STATUS_CONFIG[selectedContact.status || "pending"]?.icon}
                />
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">Nội dung tin nhắn:</Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedContact.message}
                </Typography>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">Ngày gửi:</Typography>
                <Typography variant="body1">
                  {selectedContact.createdAt ? new Date(selectedContact.createdAt).toLocaleString('vi-VN') : "N/A"}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
