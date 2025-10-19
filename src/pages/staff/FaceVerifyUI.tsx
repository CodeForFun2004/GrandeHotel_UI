// src/components/FaceVerifyUI.tsx
import React, { useEffect, useRef, useState } from "react";
import { Box, Button, Chip, Stack, Alert, Slider, Typography } from "@mui/material";

type Props = {
  matchThreshold?: number;           // default 80
  onResult?: (percent: number) => void; // trả điểm để CheckIn quyết định Next
};

export default function FaceVerifyUI({ matchThreshold = 80, onResult }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    // chỉ UI nên không preload gì cả
    setReady(true);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreaming(true);
      }
    } catch (e) {
      console.error(e);
      setErr("Không truy cập được camera – hãy cấp quyền máy ảnh cho trình duyệt.");
    }
  };

  const stopCamera = () => {
    const v = videoRef.current;
    const stream = v?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (v) v.srcObject = null;
    setStreaming(false);
  };

  // mô phỏng quét ra điểm
  const simulate = (type: "match" | "mismatch") => {
    const val =
      type === "match" ? Math.floor(85 + Math.random() * 15) : Math.floor(40 + Math.random() * 35);
    setScore(val);
    onResult?.(val);
  };

  // chỉnh tay cho demo (slider)
  const setManual = (_: Event, v: number | number[]) => {
    const val = Array.isArray(v) ? v[0] : v;
    setScore(val);
    onResult?.(val);
  };

  useEffect(() => () => stopCamera(), []);

  return (
    <Box>
      {err && <Alert severity="error" sx={{ mb: 1 }}>{err}</Alert>}

      <Box sx={{ position: "relative", borderRadius: 1, overflow: "hidden", bgcolor: "#000" }}>
        <video ref={videoRef} playsInline muted style={{ width: "100%", height: 300, objectFit: "cover" }} />
        {!streaming && (
          <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#fff", bgcolor: "rgba(0,0,0,.25)" }}>
            <Typography>Camera preview</Typography>
          </Box>
        )}
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} mt={2} alignItems="center">
        {!streaming ? (
          <Button variant="contained" onClick={startCamera} disabled={!ready}>Bật camera</Button>
        ) : (
          <Button variant="outlined" onClick={stopCamera}>Tắt camera</Button>
        )}
        <Button onClick={() => simulate("match")} disabled={!streaming}>Scan (match)</Button>
        <Button onClick={() => simulate("mismatch")} disabled={!streaming}>Scan (mismatch)</Button>
        <Chip
          label={score == null ? "Chưa quét" : `Match ${score}%`}
          color={score != null ? (score >= matchThreshold ? "success" : "warning") : "default"}
          variant="outlined"
        />
      </Stack>

      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">Chỉnh tay điểm match (demo):</Typography>
        <Slider value={score ?? 0} onChange={setManual} min={0} max={100} sx={{ maxWidth: 360 }} />
        <Typography variant="caption" color="text.secondary">Ngưỡng đậu: {matchThreshold}%</Typography>
      </Box>
    </Box>
  );
}
