import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Stack,
  Alert,
  Typography,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";

type Props = {
  matchThreshold?: number; // dùng để đổi màu chip, mặc định 80
  onResult?: (percent: number, data?: any) => void;
  /** 
   * Nếu true: FaceVerifyUI sẽ KHÔNG hiện toast success
   * (dùng khi parent có logic check riêng như so fullname/email với booking).
   */
  suppressSuccessToast?: boolean;
};

export default function FaceVerifyUI({
  matchThreshold = 80,
  onResult,
  suppressSuccessToast = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [ready, setReady] = useState(false);
  const [score, setScore] = useState<number | null>(null); // 0 hoặc 100
  const [err, setErr] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [checking, setChecking] = useState(false);
  const [matchedUser, setMatchedUser] = useState<any>(null);

  useEffect(() => {
    setReady(true);
  }, []);

  // cleanup camera
  useEffect(
    () => () => {
      stopCamera();
    },
    []
  );

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreaming(true);
      }
    } catch (e) {
      console.error(e);
      setErr(
        "Không truy cập được camera – hãy cấp quyền máy ảnh cho trình duyệt."
      );
    }
  };

  const stopCamera = () => {
    const v = videoRef.current;
    const stream = v?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (v) v.srcObject = null;
    setStreaming(false);
  };

  // Capture image from video and call API
  const captureAndVerify = async () => {
    if (!videoRef.current || !streaming) {
      toast.warning("Vui lòng bật camera trước");
      return;
    }

    try {
      setChecking(true);
      setErr(null);

      // Tạo canvas (dùng canvasRef nếu có)
      let canvas = canvasRef.current;
      if (!canvas) {
        canvas = document.createElement("canvas");
      }

      const video = videoRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Cannot get canvas context");

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataURL = canvas.toDataURL("image/jpeg", 0.8);

      console.log(
        "[FaceVerify] Calling API: POST http://localhost:9000/compare-image"
      );

      const response = await axios.post("http://localhost:9000/compare-image", {
        image: dataURL,
      });

      console.log("[FaceVerify] API response:", response.data);

      const apiData = response.data || {};

      // ❌ KHÔNG MATCH: success !== true
      if (!apiData.success) {
        const msg =
          apiData.message || "Không nhận diện được khuôn mặt trong hệ thống";

        setScore(0);
        setMatchedUser(null);
        onResult?.(0, apiData);

        console.log("[FaceVerify] Match FAIL - API success=false");

        toast.error(`❌ ${msg}`, {
          position: "top-right",
          autoClose: 4000,
        });
        return;
      }

      // ✅ MATCH: success === true
      const userData = {
        ...apiData,
        // chuẩn hóa lại key cho UI & parent
        name: apiData.fullname || apiData.name,
        email: apiData.email,
        phone_number: apiData.phone,
      };

      const uiScore = 100;
      setScore(uiScore);
      setMatchedUser(userData);
      onResult?.(uiScore, userData);

      console.log("[FaceVerify] Match PASS - Treat as 100%");

      // 👉 chỉ show toast success nếu không suppress
      if (!suppressSuccessToast) {
        toast.success(
          `✅ Nhận diện thành công: ${userData.name || "Khách hàng"}`,
          {
            position: "top-right",
            autoClose: 3000,
          }
        );
      }
    } catch (error: any) {
      console.error("[FaceVerify] API error:", error);
      setErr(
        error?.response?.data?.message ||
          error?.message ||
          "Lỗi khi nhận diện khuôn mặt"
      );

      toast.error("❌ Lỗi khi nhận diện khuôn mặt. Vui lòng thử lại.", {
        position: "top-right",
        autoClose: 4000,
      });

      setScore(0);
      setMatchedUser(null);
      onResult?.(0);
    } finally {
      setChecking(false);
    }
  };

  // mô phỏng quét (for testing only)
  const simulate = (type: "match" | "mismatch") => {
    if (type === "match") {
      const uiScore = 100;
      const fakeUser = {
        name: "Test User",
        email: "test@example.com",
      };
      setScore(uiScore);
      setMatchedUser(fakeUser);
      onResult?.(uiScore, fakeUser);

      if (!suppressSuccessToast) {
        toast.success("✅ [TEST] Nhận diện thành công (giả lập)", {
          position: "top-right",
          autoClose: 2000,
        });
      }
    } else {
      const uiScore = 0;
      setScore(uiScore);
      setMatchedUser(null);
      onResult?.(uiScore);

      toast.error("❌ [TEST] Nhận diện thất bại (giả lập)", {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  return (
    <Box>
      {err && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {err}
        </Alert>
      )}

      <Box
        sx={{
          position: "relative",
          borderRadius: 1,
          overflow: "hidden",
          bgcolor: "#000",
        }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          style={{ width: "100%", height: 300, objectFit: "cover" }}
        />
        {!streaming && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              color: "#fff",
              bgcolor: "rgba(0,0,0,.25)",
            }}
          >
            <Typography>Camera preview</Typography>
          </Box>
        )}
      </Box>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        mt={2}
        alignItems="center"
        flexWrap="wrap"
      >
        {!streaming ? (
          <Button variant="contained" onClick={startCamera} disabled={!ready}>
            Bật camera
          </Button>
        ) : (
          <Button variant="outlined" onClick={stopCamera}>
            Tắt camera
          </Button>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={captureAndVerify}
          disabled={!streaming || checking}
          startIcon={
            checking ? <CircularProgress size={20} color="inherit" /> : null
          }
        >
          {checking ? "Đang nhận diện..." : "Quét khuôn mặt"}
        </Button>

        <Chip
          label={
            score == null
              ? "Chưa quét"
              : score >= matchThreshold
              ? `Đã xác thực (${score}%)`
              : `Không khớp (${score}%)`
          }
          color={
            score == null
              ? "default"
              : score >= matchThreshold
              ? "success"
              : "error"
          }
          variant="outlined"
        />

        {/* Testing buttons - remove in production */}
        <Box sx={{ display: "flex", gap: 1, mt: { xs: 1, sm: 0 } }}>
          <Button
            size="small"
            onClick={() => simulate("match")}
            disabled={!streaming}
          >
            Test: Match
          </Button>
          <Button
            size="small"
            onClick={() => simulate("mismatch")}
            disabled={!streaming}
          >
            Test: Mismatch
          </Button>
        </Box>
      </Stack>

      {matchedUser && (
        <Alert severity="success" sx={{ mt: 2 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "120px auto",
              rowGap: 0.5,
            }}
          >
            <Typography variant="body2" fontWeight="bold">
              Khách hàng:
            </Typography>
            <Typography variant="body2">
              {matchedUser.name || matchedUser.fullname}
            </Typography>

            {matchedUser.email && (
              <>
                <Typography variant="body2" fontWeight="bold">
                  Email:
                </Typography>
                <Typography variant="body2">{matchedUser.email}</Typography>
              </>
            )}

            {matchedUser.phone_number && (
              <>
                <Typography variant="body2" fontWeight="bold">
                  SĐT:
                </Typography>
                <Typography variant="body2">
                  {matchedUser.phone_number}
                </Typography>
              </>
            )}

            {matchedUser.designation && (
              <>
                <Typography variant="body2" fontWeight="bold">
                  Chức danh:
                </Typography>
                <Typography variant="body2">
                  {matchedUser.designation}
                </Typography>
              </>
            )}
          </Box>
        </Alert>
      )}

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </Box>
  );
}
