import React from "react";
import { Card, CardContent, Alert } from "@mui/material";
import TagFacesIcon from "@mui/icons-material/TagFaces";
import { BlockHeader } from "./BlockHeader";
import FaceVerifyUI from "../../FaceVerifyUI";
import { MATCH_THRESHOLD } from "./constants";

interface FaceRecognizeCheckInFlowProps {
  step: "face" | "extras" | "assign" | "review";
  selected: any | null; // Can be any booking object, we only check if it exists
  faceScore: number | null;
  onResult: (percent: number) => void;
}

export function FaceRecognizeCheckInFlow({
  step,
  selected,
  faceScore,
  onResult,
}: FaceRecognizeCheckInFlowProps) {
  if (step === "face") {
    return (
      <Card>
        <CardContent>
          <BlockHeader
            icon={<TagFacesIcon fontSize="small" />}
            title="Quét & nhận diện khuôn mặt"
            subtitle="Dùng camera thiết bị để nhận diện khuôn mặt khách hàng"
          />
          {!selected && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Vui lòng chọn booking ở bước 1 trước khi quét.
            </Alert>
          )}

          <FaceVerifyUI
            matchThreshold={MATCH_THRESHOLD}
            onResult={onResult}
          />

          {faceScore !== null && faceScore < MATCH_THRESHOLD && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Điểm khớp chưa đạt ngưỡng. Bạn có thể quét lại hoặc chuyển sang
              Manual check-in.
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}

