# Check-in Components

Cấu trúc components được refactor từ `Check-in.tsx` thành các modules riêng biệt để dễ maintain và mở rộng.

## Cấu trúc

```
checkin/
├── types.ts                        # TypeScript types & interfaces
├── utils.ts                        # Utility functions (formatVND, validateIdDoc, etc.)
├── Row.tsx                         # Row display component (shared)
├── BlockHeader.tsx                 # Section header component (shared)
├── SummaryCard.tsx                 # Right sidebar summary card (shared)
├── ManualCheckInFlow.tsx           # Manual check-in flow component
├── FaceRecognizeCheckInFlow.tsx    # Face recognition check-in flow component
├── index.ts                        # Export all components
└── README.md                       # This file
```

## Components

### Shared Components

#### `BlockHeader`
Header cho mỗi section với icon và title/subtitle.

**Props:**
- `icon`: React.ReactNode - Icon hiển thị
- `title`: string - Tiêu đề
- `subtitle?`: string - Mô tả (optional)

**Usage:**
```tsx
<BlockHeader 
  icon={<SearchIcon />} 
  title="Tra cứu booking" 
  subtitle="Tìm booking đủ điều kiện check-in" 
/>
```

#### `Row`
Hiển thị một dòng thông tin với label và value.

**Props:**
- `label`: string - Nhãn bên trái
- `value`: React.ReactNode - Giá trị bên phải

**Usage:**
```tsx
<Row label="Khách" value="Nguyễn Văn A" />
```

#### `SummaryCard`
Card tóm tắt booking ở sidebar bên phải với navigation buttons.

**Props:**
- `selected`: CheckinSearchItem | null
- `paymentSummary`: Payment summary object
- `totalNights`: number
- `activeStep`: number
- `canNext`: boolean
- `isLastStep`: boolean
- `onBack`: () => void
- `onNext`: () => void
- `onConfirm`: () => void
- `confirmDisabled`: boolean
- `confirmLabel?`: string

### Flow Components

#### `ManualCheckInFlow`
Component xử lý flow Manual Check-in (step nhập giấy tờ).

**Props:**
- `step`: "id" | "extras" | "assign" | "review"
- `allSelectedRooms`: RoomInfo[]
- `idDocs`: Record<string, IdDocument>
- `onSetIdDocType`: (roomId: string, type: IdType) => void
- `onSetIdDocField`: (roomId: string, field, value: string) => void

**Features:**
- Validation CCCD (12 số), CMND (9 số), Passport (6-9 ký tự)
- Auto-sanitize input theo loại giấy tờ
- Hiển thị form cho từng phòng đã chọn

#### `FaceRecognizeCheckInFlow`
Component xử lý flow Face Recognition Check-in.

**Props:**
- `step`: "face" | "extras" | "assign" | "review"
- `selected`: CheckinSearchItem | null
- `faceScore`: number | null
- `onResult`: (percent: number) => void

**Features:**
- Tích hợp với FaceVerifyUI component
- Hiển thị warning nếu điểm match < 80%
- Real-time face recognition feedback

## Utilities

### `formatVND(n: number): string`
Format số thành tiền tệ VND.

### `validateIdDoc(doc?: IdDocument): boolean`
Validate giấy tờ theo loại:
- CCCD: 12 số
- CMND: 9 số
- Passport: 6-9 ký tự chữ/số (viết hoa)
- Other: 6-20 ký tự

### `sanitizeIdNumber(type: IdType, value: string): string`
Sanitize input theo loại giấy tờ:
- CCCD/CMND: Chỉ giữ số
- Passport/Other: Chuyển sang viết hoa

## Types

### `IdType`
```typescript
type IdType = 'cccd' | 'cmnd' | 'passport' | 'other';
```

### `IdDocument`
```typescript
interface IdDocument {
  type?: IdType;
  number: string;
  nameOnId: string;
  address?: string;
}
```

### `RoomInfo`
```typescript
interface RoomInfo {
  _id: string;
  roomNumber?: string;
  name?: string;
  status?: string;
}
```

## Usage trong Check-in.tsx

```tsx
import { 
  ManualCheckInFlow,
  FaceRecognizeCheckInFlow,
  BlockHeader,
  formatVND,
  validateIdDoc
} from "./components/checkin";

// Manual check-in step
{tab === 0 && activeStep === 1 && (
  <ManualCheckInFlow
    step="id"
    allSelectedRooms={allSelectedRooms}
    idDocs={idDocs}
    onSetIdDocType={setIdDocType}
    onSetIdDocField={setIdDocField}
  />
)}

// Face recognition step
{tab === 1 && activeStep === 1 && (
  <FaceRecognizeCheckInFlow
    step="face"
    selected={selected}
    faceScore={faceScore}
    onResult={(percent) => setFaceScore(percent)}
  />
)}
```

## Lợi ích

1. **Separation of Concerns**: Mỗi component có trách nhiệm rõ ràng
2. **Reusability**: Shared components có thể tái sử dụng
3. **Maintainability**: Dễ dàng tìm và sửa bug
4. **Scalability**: Dễ dàng thêm features mới (e.g., QR code check-in)
5. **Testing**: Dễ dàng test từng component riêng lẻ

## Mở rộng

Để thêm flow check-in mới (e.g., QR Code):

1. Tạo `QRCodeCheckInFlow.tsx` trong folder này
2. Export trong `index.ts`
3. Thêm tab mới trong `Check-in.tsx`
4. Sử dụng shared components (BlockHeader, Row, etc.)

## API Connection Points

Các components này đã sẵn sàng để connect với API:

- **ManualCheckInFlow**: 
  - `POST /api/checkin/verify-id` - Verify giấy tờ
  - `POST /api/checkin/confirm` - Xác nhận check-in

- **FaceRecognizeCheckInFlow**:
  - `POST /api/checkin/face-verify` - Upload ảnh và verify khuôn mặt
  - `GET /api/users/:id/photo-face` - Lấy ảnh reference của user

