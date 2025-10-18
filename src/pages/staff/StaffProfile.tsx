import React from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  Divider,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert as MuiAlert,
  Tooltip,
} from "@mui/material";
import {
  Edit as EditIcon,
  CameraAlt as CameraAltIcon,
  Email,
  Phone,
  Badge as BadgeIcon,
  Wc,
  Event,
  Person,
  Shield,
  Business,
  Place,
  CalendarMonth,
  CloudUpload,
  DeleteOutline,
  FaceRetouchingNatural,
  LockReset,
} from "@mui/icons-material";

/* =========================
   Types (match DB schema)
   ========================= */
type Role = "customer" | "admin" | "manager" | "staff";
type AccountStatus = "active" | "inactive" | "banned";

type Account = {
  Account_ID: number;
  Email: string;
  Password?: string; // UI-only
  CMND: string;
  FirstName: string;
  LastName: string;
  Gender: "male" | "female" | "other";
  DOB: string; // yyyy-MM-dd
  PhoneNumber: string;
  AvartarURL?: string;
  Role: Role;
  Status: AccountStatus;
};

type FaceData = {
  Face_ID: number;
  Account_ID: number;
  Image_URL: string;
  Created_At: string; // ISO
};

type Hotel = {
  Hotel_ID: number;
  Name: string;
  Email: string;
  PhoneNumber: string;
  Description?: string;
  Address: string;
  Manager_ID: number;
  Status: "active" | "full" | "pending request";
};

/* =========================
   Mock data (UI only)
   ========================= */
const CURRENT_HOTEL: Hotel = {
  Hotel_ID: 1,
  Name: "Deluxe Riverside Hotel",
  Email: "contact@deluxe-riverside.vn",
  PhoneNumber: "028 1234 5678",
  Address: "120 Nguyễn Huệ, Q.1, TP.HCM",
  Description: "Khách sạn trung tâm, view sông.",
  Manager_ID: 2,
  Status: "active",
};

const CURRENT_STAFF: Account = {
  Account_ID: 101,
  Email: "staff01@deluxe-riverside.vn",
  CMND: "079123456789",
  FirstName: "Lan",
  LastName: "Nguyễn",
  Gender: "female",
  DOB: "1998-05-18",
  PhoneNumber: "0909 888 777",
  AvartarURL: "https://images.unsplash.com/photo-1531123414780-f742cb1a5d7e?q=80&w=600&auto=format&fit=crop",
  Role: "staff",
  Status: "active",
};

const FACE_SAMPLES: FaceData[] = [
  {
    Face_ID: 5001,
    Account_ID: 101,
    Image_URL: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=512&auto=format&fit=crop",
    Created_At: "2025-10-01T09:24:00Z",
  },
  {
    Face_ID: 5002,
    Account_ID: 101,
    Image_URL: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=512&auto=format&fit=crop",
    Created_At: "2025-10-10T16:10:00Z",
  },
];

/* =========================
   Helpers
   ========================= */
const fullName = (a: Account) => `${a.FirstName} ${a.LastName}`;

const statusColor = (s: AccountStatus) =>
  s === "active" ? "success" : s === "inactive" ? "default" : "error";

/* =========================
   Component
   ========================= */
const StaffProfile: React.FC = () => {
  const [profile, setProfile] = React.useState<Account>({ ...CURRENT_STAFF });
  const [faces, setFaces] = React.useState<FaceData[]>(FACE_SAMPLES);
  const [snack, setSnack] = React.useState<{ open: boolean; msg: string; type: "success" | "info" | "error" }>({
    open: false,
    msg: "",
    type: "success",
  });

  const [editOpen, setEditOpen] = React.useState(false);
  const [pwdOpen, setPwdOpen] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  // form edit
  const [form, setForm] = React.useState<Account>({ ...profile });

  // form pwd
  const [oldPwd, setOldPwd] = React.useState("");
  const [newPwd, setNewPwd] = React.useState("");
  const [newPwd2, setNewPwd2] = React.useState("");

  const handleSaveProfile = () => {
    setProfile({ ...form });
    setEditOpen(false);
    setSnack({ open: true, msg: "Đã cập nhật hồ sơ.", type: "success" });
  };

  const handleChangeAvatar = (file?: File) => {
    if (!file) return;
    setUploading(true);
    // UI mock: convert to local blob URL
    const url = URL.createObjectURL(file);
    setTimeout(() => {
      setProfile((p) => ({ ...p, AvartarURL: url }));
      setUploading(false);
      setSnack({ open: true, msg: "Đã thay ảnh đại diện (mock).", type: "success" });
    }, 600);
  };

  const handleAddFace = (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const item: FaceData = {
      Face_ID: Date.now(),
      Account_ID: profile.Account_ID,
      Image_URL: url,
      Created_At: new Date().toISOString(),
    };
    setFaces((arr) => [item, ...arr]);
    setSnack({ open: true, msg: "Đã thêm ảnh FaceID (mock).", type: "success" });
  };

  const handleRemoveFace = (id: number) => {
    setFaces((arr) => arr.filter((x) => x.Face_ID !== id));
    setSnack({ open: true, msg: "Đã xoá ảnh FaceID.", type: "info" });
  };

  const handleUpdatePwd = () => {
    if (!oldPwd || !newPwd || !newPwd2) {
      setSnack({ open: true, msg: "Vui lòng nhập đủ các trường.", type: "error" });
      return;
    }
    if (newPwd !== newPwd2) {
      setSnack({ open: true, msg: "Mật khẩu mới không khớp.", type: "error" });
      return;
    }
    setPwdOpen(false);
    setSnack({ open: true, msg: "Đã đổi mật khẩu (UI mock).", type: "success" });
    setOldPwd("");
    setNewPwd("");
    setNewPwd2("");
  };

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "380px 1fr" }, gap: 2 }}>
      {/* LEFT: Profile card */}
      <Card sx={{ alignSelf: "start" }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={profile.AvartarURL}
                alt={fullName(profile)}
                sx={{ width: 88, height: 88, border: "2px solid #eee" }}
              />
              <Tooltip title="Đổi ảnh đại diện (mock)">
                <IconButton
                  size="small"
                  sx={{
                    position: "absolute",
                    right: -6,
                    bottom: -6,
                    bgcolor: "#fff",
                    border: "1px solid #e5e7eb",
                  }}
                  component="label"
                >
                  <CameraAltIcon fontSize="small" />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => handleChangeAvatar(e.target.files?.[0])}
                  />
                </IconButton>
              </Tooltip>
            </Box>

            <Box>
            <Typography variant="h6" fontWeight={800} sx={{ color: "#b8192b", fontFamily: "system-ui, -apple-system, sans-serif" }}>
                {fullName(profile)}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip size="small" icon={<Shield fontSize="small" />} label={profile.Role.toUpperCase()} />
                <Chip size="small" color={statusColor(profile.Status)} label={profile.Status} />
              </Stack>
            </Box>

            <Box sx={{ flex: 1 }} />
            <Button startIcon={<EditIcon />} variant="outlined" onClick={() => { setForm(profile); setEditOpen(true); }}>
              Sửa
            </Button>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Contact */}
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Email fontSize="small" />
              <Typography variant="body2">{profile.Email}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Phone fontSize="small" />
              <Typography variant="body2">{profile.PhoneNumber}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <BadgeIcon fontSize="small" />
              <Typography variant="body2">CMND/CCCD: {profile.CMND}</Typography>
            </Stack>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Personal */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.2,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Person fontSize="small" />
                <Typography variant="body2">Họ tên: {fullName(profile)}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Wc fontSize="small" />
                <Typography variant="body2">Giới tính: {profile.Gender === "male" ? "Nam" : profile.Gender === "female" ? "Nữ" : "Khác"}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Event fontSize="small" />
                <Typography variant="body2">Ngày sinh: {profile.DOB}</Typography>
              </Stack>
            </Box>

          <Divider sx={{ my: 2 }} />

          <Stack direction="row" spacing={1} justifyContent="space-between">
            <Button startIcon={<LockReset />} variant="text" onClick={() => setPwdOpen(true)}>
              Đổi mật khẩu
            </Button>
            <Button startIcon={<CloudUpload />} variant="text" disabled={uploading}>
              {uploading ? "Đang tải ảnh…" : "Tải hồ sơ (mock)"}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* RIGHT: Hotel + FaceData */}
      <Stack spacing={2}>
        {/* Hotel card */}
        <Card>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <Business sx={{ color: "#b8192b" }} />
                <Typography variant="h6" fontWeight={800} sx={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
                Khách sạn đang làm việc
              </Typography>
              <Chip size="small" label={CURRENT_HOTEL.Status} />
            </Stack>

              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5, fontFamily: "system-ui, -apple-system, sans-serif" }}>
              {CURRENT_HOTEL.Name}
            </Typography>
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Place fontSize="small" />
                <Typography variant="body2">{CURRENT_HOTEL.Address}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Phone fontSize="small" />
                <Typography variant="body2">{CURRENT_HOTEL.PhoneNumber}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Email fontSize="small" />
                <Typography variant="body2">{CURRENT_HOTEL.Email}</Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* FaceData card */}
        <Card>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <FaceRetouchingNatural sx={{ color: "#b8192b" }} />
                <Typography variant="h6" fontWeight={800} sx={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
                Ảnh FaceID đã lưu
              </Typography>
              <Box sx={{ flex: 1 }} />
              <Button variant="outlined" component="label" startIcon={<CloudUpload />}>
                Thêm ảnh
                <input type="file" hidden accept="image/*" onChange={(e) => handleAddFace(e.target.files?.[0])} />
              </Button>
            </Stack>

            {faces.length ? (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" },
                    gap: 1.5,
                  }}
                >
                {faces.map((f) => (
                    <Box key={f.Face_ID}>
                    <Box
                      sx={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 1,
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      <img src={f.Image_URL} alt={`Face ${f.Face_ID}`} style={{ width: "100%", display: "block", height: 140, objectFit: "cover" }} />
                      <Box sx={{ p: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <CalendarMonth fontSize="small" />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(f.Created_At).toLocaleDateString("vi-VN")}
                            </Typography>
                          </Stack>
                          <Tooltip title="Xoá ảnh này">
                            <IconButton size="small" color="error" onClick={() => handleRemoveFace(f.Face_ID)}>
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Box>
                    </Box>
                    </Box>
                ))}
                </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Chưa có ảnh FaceID nào.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Stack>

      {/* Dialog: Edit profile */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cập nhật hồ sơ</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Họ"
                fullWidth
                value={form.LastName}
                onChange={(e) => setForm((s) => ({ ...s, LastName: e.target.value }))}
              />
              <TextField
                label="Tên"
                fullWidth
                value={form.FirstName}
                onChange={(e) => setForm((s) => ({ ...s, FirstName: e.target.value }))}
              />
            </Stack>

            <TextField
              label="Email"
              fullWidth
              value={form.Email}
              onChange={(e) => setForm((s) => ({ ...s, Email: e.target.value }))}
            />

            <TextField
              label="Số điện thoại"
              fullWidth
              value={form.PhoneNumber}
              onChange={(e) => setForm((s) => ({ ...s, PhoneNumber: e.target.value }))}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="CMND/CCCD"
                fullWidth
                value={form.CMND}
                onChange={(e) => setForm((s) => ({ ...s, CMND: e.target.value }))}
              />
              <TextField
                label="Ngày sinh"
                type="date"
                fullWidth
                value={form.DOB}
                onChange={(e) => setForm((s) => ({ ...s, DOB: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            <TextField
              label="Giới tính"
              select
              fullWidth
              value={form.Gender}
              onChange={(e) => setForm((s) => ({ ...s, Gender: e.target.value as Account["Gender"] }))}
            >
              <MenuItem value="male">Nam</MenuItem>
              <MenuItem value="female">Nữ</MenuItem>
              <MenuItem value="other">Khác</MenuItem>
            </TextField>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="Vai trò" fullWidth value={form.Role.toUpperCase()} InputProps={{ readOnly: true }} />
              <TextField label="Trạng thái" fullWidth value={form.Status} InputProps={{ readOnly: true }} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Huỷ</Button>
          <Button variant="contained" sx={{ backgroundColor: "#b8192b" }} onClick={handleSaveProfile}>
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Change password (UI-only) */}
      <Dialog open={pwdOpen} onClose={() => setPwdOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Đổi mật khẩu</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Mật khẩu hiện tại"
              type="password"
              fullWidth
              value={oldPwd}
              onChange={(e) => setOldPwd(e.target.value)}
            />
            <TextField
              label="Mật khẩu mới"
              type="password"
              fullWidth
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
            />
            <TextField
              label="Nhập lại mật khẩu mới"
              type="password"
              fullWidth
              value={newPwd2}
              onChange={(e) => setNewPwd2(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPwdOpen(false)}>Đóng</Button>
          <Button variant="contained" sx={{ backgroundColor: "#b8192b" }} onClick={handleUpdatePwd}>
            Cập nhật
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={2200}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <MuiAlert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.type}
          variant="filled"
          elevation={3}
          sx={{ width: "100%" }}
        >
          {snack.msg}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default StaffProfile;
