import React, { useState } from "react";
import {
  Button,
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
import { Person, Search, Block, CheckCircle } from "@mui/icons-material";

// Basic user type
type User = {
  id: number;
  name: string;
  email: string;
  banned: boolean;
};

const initialUsers: User[] = [
  { id: 1, name: "Alice Smith", email: "alice@example.com", banned: false },
  { id: 2, name: "Bob Johnson", email: "bob@example.com", banned: true },
  { id: 3, name: "Charlie Lee", email: "charlie@example.com", banned: false },
];

const AdminUserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");

  const handleBanToggle = (id: number) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id ? { ...user, banned: !user.banned } : user
      )
    );
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight={700} color="primary.main">
        Quản lý người dùng
      </Typography>
      <Box mb={2} display="flex" justifyContent="flex-end">
        <TextField
          variant="outlined"
          size="small"
          placeholder="Tìm kiếm tên hoặc email..."
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
              <TableCell>Người dùng</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary' }}>
                  Không tìm thấy người dùng nào.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} hover sx={{ transition: '0.2s', '&:hover': { background: '#f0f4ff' } }}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ bgcolor: user.banned ? 'grey.400' : 'primary.main', width: 36, height: 36 }}>
                        <Person />
                      </Avatar>
                      <Typography fontWeight={500}>{user.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.banned ? (
                      <Chip
                        icon={<Block />}
                        label="Banned"
                        color="error"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    ) : (
                      <Chip
                        icon={<CheckCircle />}
                        label="Active"
                        color="success"
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={user.banned ? "contained" : "outlined"}
                      color={user.banned ? "success" : "error"}
                      onClick={() => handleBanToggle(user.id)}
                      sx={{ borderRadius: 2, minWidth: 90 }}
                    >
                      {user.banned ? "Unban" : "Ban"}
                    </Button>
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

export default AdminUserManagement;
