# API Integration - Check Citizen ID

## Overview

ManualCheckInFlow component đã được tích hợp với API `/api/users/check-citizen-id` để verify giấy tờ CCCD/CMND của khách hàng.

## API Endpoint

```
POST /api/users/check-citizen-id
```

### Request Body
```json
{
  "value": "123456789012"  // Số CCCD (12 số) hoặc CMND (9 số)
}
```

### Response - Success (200)
```json
{
  "message": "Khớp giấy tờ",
  "user": {
    "fullname": "Nguyễn Văn A",
    "cccd": "123456789012",
    "cmnd": null
  }
}
```

### Response - Not Found (404)
```json
{
  "message": "Không khớp giấy tờ nào trong hệ thống"
}
```

### Response - Validation Error (400)
```json
{
  "message": "Vui lòng nhập số giấy tờ để kiểm tra"
}
```

## Component Integration

### ManualCheckInFlow.tsx

Component đã được update với các tính năng sau:

#### 1. **State Management**
```typescript
interface VerificationStatus {
  verified: boolean;
  checking: boolean;
  matchedName?: string;
}

const [verificationStatus, setVerificationStatus] = useState<Record<string, VerificationStatus>>({});
```

Tracking verification status cho mỗi phòng (roomId).

#### 2. **Check Function**
```typescript
const handleCheckCitizenId = async (roomId: string) => {
  // Validate input
  // Call API
  // Auto-fill name if matched
  // Show toast notification
}
```

**Flow:**
1. Validate số giấy tờ đã nhập (min 9 ký tự)
2. Check type phải là CCCD hoặc CMND (Passport không hỗ trợ)
3. Call API với số giấy tờ
4. Nếu khớp:
   - ✅ Auto-fill "Họ tên theo giấy tờ"
   - ✅ Hiển thị Chip xanh "Đã xác thực"
   - ✅ Toast success
5. Nếu không khớp:
   - ❌ Toast error với message từ backend

#### 3. **UI Components**

**Button "Kiểm tra":**
```tsx
<Button
  variant="contained"
  onClick={() => handleCheckCitizenId(r._id)}
  disabled={
    verificationStatus[r._id]?.checking ||
    !idDocs[r._id]?.number ||
    (idDocs[r._id]?.type !== 'cccd' && idDocs[r._id]?.type !== 'cmnd')
  }
  startIcon={...}
>
  {verificationStatus[r._id]?.checking
    ? "Đang kiểm tra..."
    : verificationStatus[r._id]?.verified
    ? "Đã khớp"
    : "Kiểm tra"}
</Button>
```

**States:**
- Initial: "Kiểm tra" (SearchIcon)
- Loading: "Đang kiểm tra..." (CircularProgress)
- Verified: "Đã khớp" (CheckCircleIcon)

**Verification Badge:**
```tsx
{verificationStatus[r._id]?.verified && (
  <Chip
    icon={<CheckCircleIcon />}
    label={`Đã xác thực: ${verificationStatus[r._id]?.matchedName}`}
    color="success"
    size="small"
    variant="outlined"
  />
)}
```

#### 4. **Auto-reset on Change**
Khi user thay đổi số giấy tờ, verification status sẽ tự động reset:

```typescript
onChange={(e) => {
  onSetIdDocField(r._id, "number", e.target.value);
  // Reset verification when user changes the number
  if (verificationStatus[r._id]?.verified) {
    setVerificationStatus(prev => ({
      ...prev,
      [r._id]: { verified: false, checking: false }
    }));
  }
}}
```

## Toast Notifications

### Success
```typescript
toast.success(`✅ Khớp giấy tờ: ${user.fullname}`, {
  position: "top-right",
  autoClose: 3000,
});
```

### Error - Not Found
```typescript
toast.error("❌ Không khớp giấy tờ nào trong hệ thống", {
  position: "top-right",
  autoClose: 4000,
});
```

### Warning - Invalid Input
```typescript
toast.warning("Vui lòng nhập số giấy tờ trước khi kiểm tra");
```

### Info - Unsupported Type
```typescript
toast.info("Chức năng kiểm tra chỉ hỗ trợ CCCD và CMND");
```

## User Experience Flow

1. **Staff chọn booking** → Vào step "Nhập giấy tờ"
2. **Chọn loại giấy tờ** → CCCD hoặc CMND
3. **Nhập số giấy tờ** → Auto-sanitize (chỉ số)
4. **Click "Kiểm tra"** → Loading...
5. **API response:**
   - ✅ **Success:** Name auto-filled, badge hiển thị, toast success
   - ❌ **Not found:** Toast error, staff có thể nhập manual
6. **Staff nhập địa chỉ** (optional)
7. **Click "Tiếp tục"** → Next step

## Validation Rules

### Client-side
- Minimum 9 characters for number field
- Type must be CCCD or CMND (Passport excluded)
- Name field required (min 2 characters)

### Server-side
- Exact match with database (cccd OR cmnd)
- Returns user info if found

## Benefits

1. ✅ **Tăng tốc độ:** Auto-fill name nếu khớp
2. ✅ **Giảm lỗi:** Verify trước khi check-in
3. ✅ **Trải nghiệm tốt:** Real-time feedback với toast
4. ✅ **Optional:** Staff vẫn có thể nhập manual nếu muốn
5. ✅ **Security:** Validate ở cả client và server

## Error Handling

### Network Error
```typescript
catch (err: any) {
  const errorMsg = err?.response?.data?.message || err?.message || 'Không thể kiểm tra giấy tờ';
  toast.error(errorMsg);
}
```

### Status Code Handling
- **404:** "Không khớp giấy tờ nào trong hệ thống"
- **400:** Message từ backend (validation error)
- **500:** "Lỗi server" + error message
- **Network:** "Không thể kiểm tra giấy tờ"

## Testing Scenarios

### Happy Path
1. Nhập CCCD đúng 12 số có trong DB
2. Click "Kiểm tra"
3. Expect: Success toast, name auto-filled, badge hiển thị

### Error Cases
1. **Not in DB:** Nhập số không có trong hệ thống → 404 error toast
2. **Too short:** Nhập < 9 số → Warning toast
3. **Wrong type:** Chọn Passport → Info toast
4. **Network error:** API down → Error toast với message

## Future Enhancements

1. **Auto-check on blur:** Tự động check khi user rời khỏi input field
2. **Debounce:** Delay check để tránh spam API
3. **Cache:** Lưu kết quả đã check để tránh gọi lại
4. **OCR Integration:** Scan giấy tờ tự động
5. **Multiple IDs:** Hỗ trợ Passport verification

## Dependencies

```json
{
  "react-toastify": "^11.0.5",
  "@mui/material": "^7.3.4",
  "@mui/icons-material": "^7.3.4"
}
```

## API Function Location

```typescript
// src/api/user.ts
export const checkCitizenIdentification = async (value: string) => {
  const res = await instance.post('/users/check-citizen-id', { value });
  return res.data;
};
```

