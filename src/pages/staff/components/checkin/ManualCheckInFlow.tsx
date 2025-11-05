import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Button,
  CircularProgress,
  Chip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SearchIcon from "@mui/icons-material/Search";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import { toast } from "react-toastify";
import { BlockHeader } from "./BlockHeader";
import type { IdDocument, RoomInfo } from "./types";
import type { IdType } from "./constants";
import { sanitizeIdNumber, validateIdDoc } from "./utils";
import { checkCitizenIdentification } from "../../../../api/user";

interface ManualCheckInFlowProps {
  step: "id" | "extras" | "assign" | "review";
  allSelectedRooms: RoomInfo[];
  idDocs: Record<string, IdDocument>;
  onSetIdDocType: (roomId: string, type: IdType) => void;
  onSetIdDocField: (roomId: string, field: 'number' | 'nameOnId' | 'address', value: string) => void;
  verifiedRooms: Set<string>;
  onRoomVerified: (roomId: string) => void;
  onRoomUnverified: (roomId: string) => void;
}

interface VerificationStatus {
  verified: boolean;
  checking: boolean;
  matchedName?: string;
}

export function ManualCheckInFlow({
  step,
  allSelectedRooms,
  idDocs,
  onSetIdDocType,
  onSetIdDocField,
  verifiedRooms,
  onRoomVerified,
  onRoomUnverified,
}: ManualCheckInFlowProps) {
  // Track verification status for each room (UI state only - loading, matchedName)
  const [verificationStatus, setVerificationStatus] = useState<Record<string, VerificationStatus>>({});

  const handleCheckCitizenId = async (roomId: string) => {
    const doc = idDocs[roomId];
    if (!doc || !doc.number || doc.number.length < 9) {
      toast.warning("Vui lòng nhập số giấy tờ trước khi kiểm tra");
      return;
    }

    // Check if type is cccd or cmnd only (passport not supported by this API)
    if (doc.type !== 'cccd' && doc.type !== 'cmnd') {
      toast.info("Chức năng kiểm tra chỉ hỗ trợ CCCD và CMND");
      return;
    }

    try {
      setVerificationStatus(prev => ({
        ...prev,
        [roomId]: { verified: false, checking: true }
      }));

      const response = await checkCitizenIdentification(doc.number);
      const user = response?.user;

      if (user) {
        // Success - auto fill name
        onSetIdDocField(roomId, 'nameOnId', user.fullname || '');
        
        // Update local UI state
        setVerificationStatus(prev => ({
          ...prev,
          [roomId]: { 
            verified: true, 
            checking: false,
            matchedName: user.fullname 
          }
        }));

        // Update parent state (for validation)
        onRoomVerified(roomId);

        toast.success(`✅ Khớp giấy tờ: ${user.fullname}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err: any) {
      console.error('[ManualCheckIn] Check citizen ID failed:', err);
      
      setVerificationStatus(prev => ({
        ...prev,
        [roomId]: { verified: false, checking: false }
      }));

      const errorMsg = err?.response?.data?.message || err?.message || 'Không thể kiểm tra giấy tờ';
      
      if (err?.response?.status === 404) {
        toast.error("❌ Không khớp giấy tờ nào trong hệ thống", {
          position: "top-right",
          autoClose: 4000,
        });
      } else {
        toast.error(errorMsg, {
          position: "top-right",
          autoClose: 4000,
        });
      }
    }
  };

  if (step === "id") {
    return (
      <Card>
        <CardContent>
          <BlockHeader
            icon={<FactCheckIcon fontSize="small" />}
            title="Nhập thông tin giấy tờ cho từng phòng"
            subtitle="Yêu cầu: 1 người đại diện/1 phòng"
          />
          {allSelectedRooms.length === 0 && (
            <Alert severity="warning">
              Chưa có phòng được chọn. Hệ thống sẽ tự động gán dựa trên đặt phòng.
            </Alert>
          )}
          <Stack spacing={2}>
            {allSelectedRooms.map((r) => (
              <Card key={r._id} variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Phòng {r.roomNumber || r.name || r._id}
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      gap: 2,
                    }}
                  >
                    <FormControl fullWidth>
                      <InputLabel>Loại giấy tờ</InputLabel>
                      <Select
                        label="Loại giấy tờ"
                        value={idDocs[r._id]?.type || "cccd"}
                        onChange={(e) =>
                          onSetIdDocType(r._id, e.target.value as IdType)
                        }
                      >
                        <MenuItem value="cccd">CCCD (12 số)</MenuItem>
                        <MenuItem value="cmnd">CMND (9 số)</MenuItem>
                        <MenuItem value="passport">
                          Passport (6–9 ký tự chữ/số)
                        </MenuItem>
                        <MenuItem value="other">Khác</MenuItem>
                      </Select>
                    </FormControl>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                      <TextField
                        fullWidth
                        label="Số CCCD/Hộ chiếu"
                        value={idDocs[r._id]?.number || ""}
                        onChange={(e) => {
                          onSetIdDocField(r._id, "number", e.target.value);
                          // Reset verification when user changes the number
                          if (verificationStatus[r._id]?.verified || verifiedRooms.has(r._id)) {
                            setVerificationStatus(prev => ({
                              ...prev,
                              [r._id]: { verified: false, checking: false }
                            }));
                            onRoomUnverified(r._id);
                          }
                        }}
                      />
                      <Button
                        variant="contained"
                        onClick={() => handleCheckCitizenId(r._id)}
                        disabled={
                          verificationStatus[r._id]?.checking ||
                          !idDocs[r._id]?.number ||
                          (idDocs[r._id]?.type !== 'cccd' && idDocs[r._id]?.type !== 'cmnd')
                        }
                        sx={{ minWidth: 120, height: 56 }}
                        color={verifiedRooms.has(r._id) ? "success" : "primary"}
                        startIcon={
                          verificationStatus[r._id]?.checking ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : verifiedRooms.has(r._id) ? (
                            <CheckCircleIcon />
                          ) : (
                            <SearchIcon />
                          )
                        }
                      >
                        {verificationStatus[r._id]?.checking
                          ? "Đang kiểm tra..."
                          : verifiedRooms.has(r._id)
                          ? "Đã khớp"
                          : "Kiểm tra"}
                      </Button>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <TextField
                        fullWidth
                        label="Họ tên theo giấy tờ"
                        value={idDocs[r._id]?.nameOnId || ""}
                        onChange={(e) =>
                          onSetIdDocField(r._id, "nameOnId", e.target.value)
                        }
                      />
                      {verifiedRooms.has(r._id) && (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label={`Đã xác thực: ${verificationStatus[r._id]?.matchedName || idDocs[r._id]?.nameOnId}`}
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    <Box sx={{ gridColumn: "1 / -1" }}>
                      <TextField
                        fullWidth
                        label="Địa chỉ (tuỳ chọn)"
                        value={idDocs[r._id]?.address || ""}
                        onChange={(e) =>
                          onSetIdDocField(r._id, "address", e.target.value)
                        }
                      />
                    </Box>
                    {!validateIdDoc(idDocs[r._id]) && (
                      <Box sx={{ gridColumn: "1 / -1" }}>
                        <Alert severity="warning">
                          Vui lòng nhập đúng định dạng. Quy tắc: CCCD 12 số;
                          CMND 9 số; Passport 6–9 ký tự chữ/số (viết hoa).
                        </Alert>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return null;
}

