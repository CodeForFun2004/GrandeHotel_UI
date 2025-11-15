# Face Recognition API Integration

## Overview

FaceVerifyUI component đã được tích hợp với AI Face Recognition API để verify khuôn mặt khách hàng tự động.

## API Endpoint

```
POST http://localhost:9000/compare-image
```

### Request Body
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA..."  // Base64 dataURL
}
```

### Response - Success Match
```json
{
  "success": true,
  "name": "Nguyễn Tèo",
  "email": "nteo9820@gmail.com",
  "phone_number": "0123456789",
  "designation": "Customer",
  "photo": "https://..."
}
```

### Response - No Match
```json
{
  "success": false
}
```

## Component Updates

### FaceVerifyUI.tsx

#### New Features:
1. ✅ **Capture image from video stream**
2. ✅ **Convert to base64 dataURL**
3. ✅ **Call AI face recognition API**
4. ✅ **Auto-set score based on API result**
5. ✅ **Display matched user information**
6. ✅ **Toast notifications for all states**

#### New State Variables:
```typescript
const [checking, setChecking] = useState(false);      // Loading state
const [matchedUser, setMatchedUser] = useState<any>(null); // Matched user data
```

#### Main Function:
```typescript
const captureAndVerify = async () => {
  // 1. Capture current video frame
  // 2. Convert to base64 dataURL
  // 3. POST to API
  // 4. Handle response
}
```

#### Flow:
```
1. Staff clicks "Bật camera"
   ↓
2. Camera preview shows
   ↓
3. Staff clicks "Quét khuôn mặt"
   ↓
4. Capture current frame → Convert to base64
   ↓
5. POST http://localhost:9000/compare-image
   ↓
6a. ✅ success: true
    - Set score = 95% (high)
    - Save user data
    - Toast: "✅ Nhận diện thành công: [name]"
    - Show user info alert
    - Button "Tiếp tục" → ENABLED
   
6b. ❌ success: false
    - Set score = 45% (low)
    - Toast: "❌ Không nhận diện được khuôn mặt..."
    - Button "Tiếp tục" → DISABLED
```

### Check-in.tsx

#### New State Variables:
```typescript
const [faceVerified, setFaceVerified] = useState(false);
const [faceUserData, setFaceUserData] = useState<any>(null);
const faceOK = faceVerified && (faceScore ?? 0) >= MATCH_THRESHOLD;
```

#### Updated onResult Handler:
```typescript
onResult={(percent, userData) => {
  setFaceScore(percent);
  if (userData && percent >= MATCH_THRESHOLD) {
    setFaceVerified(true);
    setFaceUserData(userData);
  } else {
    setFaceVerified(false);
    setFaceUserData(null);
  }
}}
```

#### Validation Logic:
```typescript
// canNext check for face step
if (activeStep === 1) {
  return faceVerified && faceScore >= MATCH_THRESHOLD;
}

// handleNext validation
if (tab === 1 && activeStep === 1) {
  if (!faceVerified) {
    toast.error("⚠️ Vui lòng quét khuôn mặt để xác thực");
    return; // Block next
  }
  if (faceScore < MATCH_THRESHOLD) {
    toast.error("⚠️ Điểm khớp khuôn mặt chưa đạt ngưỡng");
    return; // Block next
  }
}
```

## UI Components

### Button "Quét khuôn mặt"
```tsx
<Button 
  variant="contained" 
  color="primary"
  onClick={captureAndVerify} 
  disabled={!streaming || checking}
  startIcon={checking ? <CircularProgress /> : null}
>
  {checking ? "Đang nhận diện..." : "Quét khuôn mặt"}
</Button>
```

**States:**
- Disabled (camera off): Grayed out
- Ready: "Quét khuôn mặt"
- Checking: "Đang nhận diện..." + spinner
- Success: Button enabled lại để scan again

### Match Score Chip
```tsx
<Chip
  label={score == null ? "Chưa quét" : `Match ${score}%`}
  color={score >= 80 ? "success" : "warning"}
  variant="outlined"
/>
```

### User Info Alert (after success)
```tsx
<Alert severity="success">
  Khách hàng: Nguyễn Tèo
  Email: nteo9820@gmail.com
  SĐT: 0123456789
  Chức danh: Customer
</Alert>
```

## Toast Notifications

| Scenario | Toast Message | Type |
|----------|---------------|------|
| Match success | ✅ Nhận diện thành công: [name] | Success |
| No match | ❌ Không nhận diện được khuôn mặt trong hệ thống | Error |
| Camera not on | Vui lòng bật camera trước | Warning |
| API error | ❌ Lỗi khi nhận diện khuôn mặt. Vui lòng thử lại. | Error |
| Click Next without verify | ⚠️ Vui lòng quét khuôn mặt để xác thực | Error |
| Score too low | ⚠️ Điểm khớp khuôn mặt chưa đạt ngưỡng (45% < 80%) | Error |

## Testing Features

Component vẫn giữ các testing buttons:
- **"Test: Match"** - Simulate successful match (85-100%)
- **"Test: Mismatch"** - Simulate failed match (40-75%)
- **Manual slider** - Adjust score manually

## Image Capture Technical Details

### Canvas Capture:
```typescript
const canvas = document.createElement('canvas');
const video = videoRef.current;
canvas.width = video.videoWidth;
canvas.height = video.videoHeight;
const ctx = canvas.getContext('2d');
ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
const dataURL = canvas.toDataURL('image/jpeg', 0.8);
```

**Quality:** 80% JPEG compression (balance between quality and size)

## User Experience Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Staff chọn booking                                   │
│    ↓                                                     │
│ 2. Chuyển sang tab "Face recognize check-in"           │
│    ↓                                                     │
│ 3. Bật camera                                           │
│    ↓                                                     │
│ 4. Khách hàng đứng trước camera                        │
│    ↓                                                     │
│ 5. Staff click "Quét khuôn mặt"                        │
│    ↓                                                     │
│ 6. Capture → Send to AI API                            │
│    ↓                                                     │
│ 7a. ✅ Match (score 95%)                               │
│     - Toast success                                     │
│     - Show user info                                    │
│     - Button "Tiếp tục" enabled                        │
│     - Next step: "Ngoại lệ & ghi chú"                  │
│                                                          │
│ 7b. ❌ No match (score 45%)                            │
│     - Toast error                                       │
│     - Button "Tiếp tục" disabled                       │
│     - Staff có thể:                                     │
│       • Scan lại                                        │
│       • Chuyển sang Manual check-in                    │
└─────────────────────────────────────────────────────────┘
```

## Validation Rules

### Client-side:
1. ✅ Camera must be active
2. ✅ Must call API (not just simulate)
3. ✅ Score must be >= 80%
4. ✅ Must receive success: true from API

### Server-side (AI API):
1. Face detection in image
2. Face matching with database
3. Return user info if matched

## Error Handling

| Error Type | Handling |
|------------|----------|
| Camera permission denied | Alert + toast |
| API network error | Toast error + score = 0 |
| API returns error | Toast error + score = 0 |
| No face detected | success: false → score = 45% |
| Low confidence match | success: false → score = 45% |

## Security & Privacy

1. ✅ Image captured only on demand (click button)
2. ✅ Base64 sent to API (no file storage)
3. ✅ Camera auto-stops on component unmount
4. ✅ Validation prevents bypass

## Benefits

1. ✅ **Faster check-in:** No manual ID entry needed
2. ✅ **Higher accuracy:** AI face recognition
3. ✅ **Better UX:** One-click verification
4. ✅ **Secure:** Cannot proceed without match
5. ✅ **Fallback:** Can switch to Manual if needed

## Development vs Production

### Development (Current):
- Testing buttons visible
- Manual slider visible
- Console logs enabled
- localhost:9000 API

### Production (To-do):
1. Hide testing buttons
2. Hide manual slider
3. Remove console logs
4. Update API URL to production
5. Add retry mechanism
6. Add timeout handling

## API Configuration

```typescript
// Current: localhost
axios.post('http://localhost:9000/compare-image', { image: dataURL })

// Production (update to):
// axios.post(process.env.VITE_FACE_API_URL + '/compare-image', { image: dataURL })
```

## Dependencies

```json
{
  "axios": "^1.12.2",
  "react-toastify": "^11.0.5",
  "@mui/material": "^7.3.4"
}
```

## Future Enhancements

1. **Multiple attempts:** Allow 3 retries before forcing Manual
2. **Image quality check:** Warn if lighting too dark/bright
3. **Liveness detection:** Detect if it's a real person (not photo)
4. **Progress indicator:** Show upload progress
5. **Offline mode:** Queue requests when offline

