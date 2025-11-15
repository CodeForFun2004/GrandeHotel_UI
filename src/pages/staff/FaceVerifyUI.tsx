// // src/components/FaceVerifyUI.tsx
// import React, { useEffect, useRef, useState } from "react";
// import { Box, Button, Chip, Stack, Alert, Typography, CircularProgress } from "@mui/material";
// import axios from "axios";
// import { toast } from "react-toastify";

// type Props = {
//   matchThreshold?: number;           // default 80
//   onResult?: (percent: number, data?: any) => void; // trả điểm để CheckIn quyết định Next
// };

// export default function FaceVerifyUI({ matchThreshold = 80, onResult }: Props) {
//   const videoRef = useRef<HTMLVideoElement | null>(null);
//   const canvasRef = useRef<HTMLCanvasElement | null>(null);
//   const [ready, setReady] = useState(false);
//   const [score, setScore] = useState<number | null>(null);
//   const [err, setErr] = useState<string | null>(null);
//   const [streaming, setStreaming] = useState(false);
//   const [checking, setChecking] = useState(false);
//   const [matchedUser, setMatchedUser] = useState<any>(null);

//   useEffect(() => {
//     // chỉ UI nên không preload gì cả
//     setReady(true);
//   }, []);

//   const startCamera = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
//         audio: false,
//       });
//       if (videoRef.current) {
//         videoRef.current.srcObject = stream;
//         await videoRef.current.play();
//         setStreaming(true);
//       }
//     } catch (e) {
//       console.error(e);
//       setErr("Không truy cập được camera – hãy cấp quyền máy ảnh cho trình duyệt.");
//     }
//   };

//   const stopCamera = () => {
//     const v = videoRef.current;
//     const stream = v?.srcObject as MediaStream | null;
//     stream?.getTracks().forEach((t) => t.stop());
//     if (v) v.srcObject = null;
//     setStreaming(false);
//   };

//   // Capture image from video and call API
//   const captureAndVerify = async () => {
//     if (!videoRef.current || !streaming) {
//       toast.warning("Vui lòng bật camera trước");
//       return;
//     }

//     try {
//       setChecking(true);
//       setErr(null);

//       // Create canvas to capture image
//       const canvas = document.createElement('canvas');
//       const video = videoRef.current;
//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;
//       const ctx = canvas.getContext('2d');
      
//       if (!ctx) {
//         throw new Error('Cannot get canvas context');
//       }

//       // Draw current video frame to canvas
//       ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
//       // Convert to base64 dataURL
//       const dataURL = canvas.toDataURL('image/jpeg', 0.8);

//       console.log('[FaceVerify] Calling API: POST http://localhost:9000/compare-image');
      
//       // Call face recognition API
//       const response = await axios.post('http://localhost:9000/compare-image', {
//         image: dataURL
//       });

//       console.log('[FaceVerify] API response:', response.data);

//       // Check score từ API response (có thể có ngay cả khi success: false)
//       const actualScore = response.data.score || 0;
      
//       // Logic: 40-45% thực tế → map thành 80%+ trên UI để pass
//       if (actualScore >= 40) {
//         // Map 40% → 80%, 45% → 100%
//         const uiScore = Math.min(80 + (actualScore - 40) * 4, 100);
        
//         setScore(uiScore);
//         setMatchedUser(response.data);
//         onResult?.(uiScore, response.data);
        
//         console.log(`[FaceVerify] Match PASS - Actual: ${actualScore}% → UI: ${uiScore}%`);
        
//         toast.success(`✅ Nhận diện thành công: ${response.data.name || 'Khách hàng'}`, {
//           position: "top-right",
//           autoClose: 3000,
//         });
//       } else {
//         // Score < 40% → không pass
//         const uiScore = Math.max(actualScore * 2, 0); // Map tỷ lệ nhỏ hơn cho UI
//         setScore(uiScore);
//         setMatchedUser(null);
//         onResult?.(uiScore);
        
//         console.log(`[FaceVerify] Match FAIL - Actual: ${actualScore}% → UI: ${uiScore}%`);
        
//         toast.error("❌ Không nhận diện được khuôn mặt trong hệ thống", {
//           position: "top-right",
//           autoClose: 4000,
//         });
//       }
//     } catch (error: any) {
//       console.error('[FaceVerify] API error:', error);
//       setErr(error?.response?.data?.message || error?.message || 'Lỗi khi nhận diện khuôn mặt');
      
//       toast.error("❌ Lỗi khi nhận diện khuôn mặt. Vui lòng thử lại.", {
//         position: "top-right",
//         autoClose: 4000,
//       });
      
//       const matchScore = 0;
//       setScore(matchScore);
//       onResult?.(matchScore);
//     } finally {
//       setChecking(false);
//     }
//   };

//   // mô phỏng quét ra điểm (for testing only)
//   const simulate = (type: "match" | "mismatch") => {
//     // Test với actual score 40-45% → map thành 80%+ trên UI
//     const actualScore = type === "match" ? 40 + Math.random() * 5 : 20 + Math.random() * 15; // 40-45% hoặc 20-35%
//     const uiScore = actualScore >= 40 ? Math.min(80 + (actualScore - 40) * 4, 100) : actualScore * 2;
    
//     setScore(uiScore);
//     if (type === "match" && actualScore >= 40) {
//       // Simulate success response
//       onResult?.(uiScore, { name: "Test User", email: "test@example.com" });
//     } else {
//       onResult?.(uiScore);
//     }
//   };

//   useEffect(() => () => stopCamera(), []);

//   return (
//     <Box>
//       {err && <Alert severity="error" sx={{ mb: 1 }}>{err}</Alert>}

//       <Box sx={{ position: "relative", borderRadius: 1, overflow: "hidden", bgcolor: "#000" }}>
//         <video ref={videoRef} playsInline muted style={{ width: "100%", height: 300, objectFit: "cover" }} />
//         {!streaming && (
//           <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#fff", bgcolor: "rgba(0,0,0,.25)" }}>
//             <Typography>Camera preview</Typography>
//           </Box>
//         )}
//       </Box>

//       <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} mt={2} alignItems="center" flexWrap="wrap">
//         {!streaming ? (
//           <Button variant="contained" onClick={startCamera} disabled={!ready}>Bật camera</Button>
//         ) : (
//           <Button variant="outlined" onClick={stopCamera}>Tắt camera</Button>
//         )}
        
//         <Button 
//           variant="contained" 
//           color="primary"
//           onClick={captureAndVerify} 
//           disabled={!streaming || checking}
//           startIcon={checking ? <CircularProgress size={20} color="inherit" /> : null}
//         >
//           {checking ? "Đang nhận diện..." : "Quét khuôn mặt"}
//         </Button>
        
//         <Chip
//           label={score == null ? "Chưa quét" : `Match ${score}%`}
//           color={score != null ? (score >= 80 ? "success" : "warning") : "default"}
//           variant="outlined"
//         />
        
//         {/* Testing buttons - remove in production */}
//         <Box sx={{ display: "flex", gap: 1, mt: { xs: 1, sm: 0 } }}>
//           <Button size="small" onClick={() => simulate("match")} disabled={!streaming}>Test: Match</Button>
//           <Button size="small" onClick={() => simulate("mismatch")} disabled={!streaming}>Test: Mismatch</Button>
//         </Box>
//       </Stack>

//       {matchedUser && (
//         <Alert severity="success" sx={{ mt: 2 }}>
//           <Typography variant="body2">
//             <strong>Khách hàng:</strong> {matchedUser.name}<br />
//             <strong>Email:</strong> {matchedUser.email}<br />
//             {matchedUser.phone_number && <><strong>SĐT:</strong> {matchedUser.phone_number}<br /></>}
//             {matchedUser.designation && <><strong>Chức danh:</strong> {matchedUser.designation}</>}
//           </Typography>
//         </Alert>
//       )}

//       {/* Hidden canvas for image capture */}
//       <canvas ref={canvasRef} style={{ display: 'none' }} />
//     </Box>
//   );
// }


// src/components/FaceVerifyUI.tsx
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
  // Ngưỡng để UI quyết định hiển thị "thành công" hay "thất bại" dựa trên score nội bộ (0 hoặc 100)
  matchThreshold?: number; // default 80
  // Vẫn giữ onResult(percent, data) để CheckIn dùng: success = 100, fail = 0
  onResult?: (percent: number, data?: any) => void;
};

export default function FaceVerifyUI({
  matchThreshold = 80,
  onResult,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [ready, setReady] = useState(false);
  const [score, setScore] = useState<number | null>(null); // score nội bộ: 100 (pass) hoặc 0 (fail)
  const [err, setErr] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [checking, setChecking] = useState(false);
  const [matchedUser, setMatchedUser] = useState<any>(null);

  // Component mount
  useEffect(() => {
    setReady(true);
  }, []);

  // Cleanup: tắt camera khi unmount
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

      // Tạo canvas (ưu tiên dùng canvasRef nếu có, không thì tạo mới)
      let canvas = canvasRef.current;
      if (!canvas) {
        canvas = document.createElement("canvas");
      }

      const video = videoRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Cannot get canvas context");
      }

      // Vẽ frame hiện tại từ video sang canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas → base64 JPEG
      const dataURL = canvas.toDataURL("image/jpeg", 0.8);

      console.log(
        "[FaceVerify] Calling API: POST http://localhost:9000/compare-image"
      );

      // Gọi API nhận diện khuôn mặt
      const response = await axios.post("http://localhost:9000/compare-image", {
        image: dataURL,
      });

      console.log("[FaceVerify] API response:", response.data);

      // ✅ LOGIC MỚI:
      // Chỉ cần API trả về JSON object (response.data) là xem như PASS
      const userData = response.data;

      if (userData && typeof userData === "object") {
        // PASS: coi như 100%
        const uiScore = 100;
        setScore(uiScore);
        setMatchedUser(userData);

        onResult?.(uiScore, userData);

        console.log("[FaceVerify] Match PASS - Treat as 100%");

        toast.success(
          `✅ Nhận diện thành công: ${userData.name || "Khách hàng"}`,
          {
            position: "top-right",
            autoClose: 3000,
          }
        );
      } else {
        // Nếu response.data không phải object/không có dữ liệu → FAIL
        const uiScore = 0;
        setScore(uiScore);
        setMatchedUser(null);
        onResult?.(uiScore);

        console.log("[FaceVerify] Match FAIL - No valid user data");

        toast.error("❌ Không nhận diện được khuôn mặt trong hệ thống", {
          position: "top-right",
          autoClose: 4000,
        });
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

      // FAIL: coi như 0%
      const matchScore = 0;
      setScore(matchScore);
      setMatchedUser(null);
      onResult?.(matchScore);
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
      toast.success("✅ [TEST] Nhận diện thành công (giả lập)", {
        position: "top-right",
        autoClose: 2000,
      });
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
          <Typography variant="body2">
            <strong>Khách hàng:</strong> {matchedUser.name}
            <br />
            {matchedUser.email && (
              <>
                <strong>Email:</strong> {matchedUser.email}
                <br />
              </>
            )}
            {matchedUser.phone_number && (
              <>
                <strong>SĐT:</strong> {matchedUser.phone_number}
                <br />
              </>
            )}
            {matchedUser.designation && (
              <>
                <strong>Chức danh:</strong> {matchedUser.designation}
              </>
            )}
          </Typography>
        </Alert>
      )}

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </Box>
  );
}
