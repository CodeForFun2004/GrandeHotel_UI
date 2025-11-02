# Luồng Đặt Phòng Khách Sạn - Grand Hotel

## Tổng Quan
Hệ thống đặt phòng khách sạn hoàn chỉnh với 6 bước xử lý từ chọn phòng đến hóa đơn thanh toán.

## Luồng Xử Lý

### 1. **Reservation Review** (`/reservation/review`)
- Trang xác nhận thông tin đặt phòng từ trang chọn phòng
- Hiển thị tóm tắt: khách sạn, ngày, phòng, tổng tiền
- Nút "Xác nhận & Thanh toán" → chuyển đến Reservation Form

### 2. **Reservation Form** (`/reservation/form`)
- Form chọn phương thức thanh toán: **Full Payment** hoặc **Deposit Payment (50%)**
- Hiển thị chi tiết đặt phòng và tính toán số tiền
- Tích hợp API: `POST /api/reservations/:id/payment-options`
- Sau khi chọn → chuyển đến Pending Approval

### 3. **Pending Approval** (`/reservation/pending`)
- Hiển thị trạng thái "Đang chờ xác nhận"
- Thông tin chi tiết đặt phòng
- Nút "Làm mới" để cập nhật trạng thái
- Khi được approve → hiển thị nút "Tiến hành thanh toán"

### 4. **Payment Options** (`/reservation/payment-options`)
- 2 options thanh toán: Full Payment vs Deposit Payment
- Hiển thị breakdown giá tiền chi tiết
- Tích hợp API: `POST /api/reservations/:id/payment-options`
- Sau khi chọn → chuyển đến QR Payment

### 5. **QR Payment** (`/reservation/qr-payment`)
- Hiển thị QR code để scan chuyển khoản
- Thông tin tài khoản ngân hàng
- Hướng dẫn thanh toán chi tiết
- Tích hợp API: `GET /api/reservations/:id/payment-qr`
- Nút "Tôi đã thanh toán" → chuyển đến Payment Confirmation

### 6. **Payment Confirmation** (`/reservation/payment-confirmation`)
- Loading spinner với progress steps
- Xác nhận thanh toán thành công
- Auto-redirect đến Bill page sau 5 giây
- Tích hợp API: `PUT /api/reservations/:id/payment`

### 7. **Bill Page** (`/reservation/bill`)
- Hóa đơn đầy đủ với thông tin khách sạn
- Chi tiết đặt phòng và thanh toán
- QR code check-in
- Nút in hóa đơn, tải PDF, đặt phòng mới

## API Endpoints

```typescript
// Tạo reservation
POST /api/reservations
{
  hotelId: string,
  customerId: string,
  checkInDate: string,
  checkOutDate: string,
  numberOfGuests: number,
  rooms: Array<{...}>,
  paymentType: 'full' | 'deposit',
  totalAmount: number
}

// Chọn payment option
POST /api/reservations/:id/payment-options
{
  paymentType: 'full' | 'deposit'
}

// Lấy QR code thanh toán
GET /api/reservations/:id/payment-qr
Response: {
  qrCode: string,
  bankAccount: string,
  accountName: string,
  amount: number,
  content: string,
  expiredAt: string
}

// Xác nhận thanh toán
PUT /api/reservations/:id/payment
{
  paymentMethod: 'bank_transfer',
  transactionId: string,
  amount: number,
  status: 'completed'
}

// Lấy thông tin reservation
GET /api/reservations/:id
```

## Tính Năng Chính

### ✅ **Payment Options**
- **Full Payment**: Thanh toán toàn bộ 100%
- **Deposit Payment**: Thanh toán cọc 50%, còn lại khi nhận phòng

### ✅ **QR Code Payment**
- QR code tự động tạo cho từng giao dịch
- Thông tin ngân hàng chi tiết
- Hướng dẫn thanh toán step-by-step

### ✅ **Real-time Status**
- Trạng thái đặt phòng real-time
- Auto-refresh để cập nhật status
- Progress indicator cho từng bước

### ✅ **Responsive Design**
- Mobile-first approach
- Modern UI với gradient backgrounds
- Loading states và error handling

### ✅ **Bill Management**
- Hóa đơn chuyên nghiệp
- QR code check-in
- Print và download PDF
- Thông tin chi tiết đầy đủ

## Cấu Trúc Files

```
src/pages/
├── ReservationForm.tsx              # Form chọn payment option
├── ReservationForm.css
├── ReservationPending.tsx           # Trang chờ approve
├── ReservationPending.css
├── ReservationPaymentOptions.tsx    # Chọn Full/Deposit
├── ReservationPaymentOptions.css
├── ReservationQRPayment.tsx         # QR code thanh toán
├── ReservationQRPayment.css
├── ReservationPaymentConfirmation.tsx # Xác nhận thanh toán
├── ReservationPaymentConfirmation.css
├── ReservationBill.tsx              # Trang hóa đơn
└── ReservationBill.css

src/api/
└── reservation.ts                   # API functions mở rộng

src/routes/
└── AppRouter.tsx                    # Routing cập nhật
```

## Dependencies Mới

```json
{
  "qrcode.react": "^3.1.0",
  "@types/qrcode.react": "^1.0.5"
}
```

## Cách Sử Dụng

1. **Từ trang chọn phòng** → `/reservation/review`
2. **Xác nhận thông tin** → `/reservation/form`
3. **Chọn payment option** → `/reservation/pending`
4. **Chờ approve** → `/reservation/payment-options`
5. **Chọn lại payment** → `/reservation/qr-payment`
6. **Thanh toán QR** → `/reservation/payment-confirmation`
7. **Xác nhận** → `/reservation/bill`

## Lưu Ý

- Tất cả trang đều có role-based access (chỉ CUSTOMER)
- Error handling đầy đủ cho mọi API calls
- Loading states cho UX tốt hơn
- Responsive design cho mobile
- Print-friendly cho Bill page

