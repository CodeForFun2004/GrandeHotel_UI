# Reservation 401 Error - Debug Summary

## Vấn đề hiện tại

Sau khi refresh token thành công và token có đầy đủ `role: "customer"`, request `POST /api/reservations` vẫn bị reject với 401 Unauthorized.

## Xác nhận từ logs

✅ **Token hợp lệ:**
- `id`: `68e5d4dc5330fe88ef797299`
- `role`: `"customer"` ✅
- `exp`: `2025-11-04T04:39:49.000Z`
- `isExpired`: `false` ✅

✅ **Request headers đúng:**
- `Authorization: Bearer eyJhbGciOiJIUzI1NiIs...` ✅
- `Content-Type: application/json` ✅

✅ **Request payload đúng:**
- `customerId`: `68e5d4dc5330fe88ef797299` ✅ (matches token id)
- `hotelId`: `68f6fb33d5d4ba93788cab3e`
- `checkInDate`, `checkOutDate`, `numberOfGuests`, `rooms` đều có

❌ **Backend response:**
- `401 Unauthorized`
- `message: "Authentication required to create reservation."`

## Các nguyên nhân có thể

### 1. Backend middleware không đọc được token ⚠️

**Triệu chứng:**
- Token valid nhưng backend không parse được
- Có thể do format header khác hoặc middleware parse sai

**Cách kiểm tra:**
- Xem backend logs khi nhận request
- Kiểm tra middleware có đọc `req.headers.authorization` không
- Xem có middleware nào transform headers không

### 2. Backend có middleware riêng cho `/reservations` ⚠️⚠️

**Triệu chứng:**
- Endpoint khác hoạt động nhưng `/reservations` không
- Có middleware đặc biệt check authentication

**Cách kiểm tra:**
- Xem backend routes cho `/reservations`
- Kiểm tra middleware chain
- Xem có middleware nào check thêm điều kiện không

### 3. Backend yêu cầu thêm thông tin trong token ⚠️

**Triệu chứng:**
- Token có `id`, `role` nhưng thiếu field khác
- Backend có thể check `email`, `phone`, `status`, etc.

**Cách kiểm tra:**
- Xem backend middleware code
- Kiểm tra xem có check field nào khác không
- So sánh token từ login với token từ refresh

### 4. Token signature không đúng ⚠️⚠️

**Triệu chứng:**
- Token payload đúng nhưng signature sai
- Backend không verify được signature

**Cách kiểm tra:**
- Xem backend có dùng JWT_SECRET khác không
- Kiểm tra refresh token endpoint có dùng đúng secret không
- Xem có nhiều JWT_SECRET không (dev vs prod)

### 5. Backend cache token cũ ⚠️

**Triệu chứng:**
- Token mới được tạo nhưng backend vẫn check token cũ
- Có thể có blacklist hoặc cache

**Cách kiểm tra:**
- Xem backend có cache token không
- Kiểm tra có blacklist token không
- Xem có Redis cache không

### 6. Backend check user status/role từ database ⚠️⚠️⚠️

**Triệu chứng:**
- Token valid nhưng user trong database có thể bị:
  - Banned
  - Role changed
  - Status inactive

**Cách kiểm tra:**
- Query database xem user có status gì
- Kiểm tra user có bị ban không
- Xem role trong database có match với token không

## Các bước debug tiếp theo

### Frontend (đã làm):
1. ✅ Log token payload
2. ✅ Log request headers
3. ✅ Log request data
4. ✅ Verify customerId match
5. ✅ Check token expiration

### Backend (cần làm):

1. **Kiểm tra middleware chain:**
   ```javascript
   // Xem middleware nào được apply cho /reservations
   router.post('/reservations', authMiddleware, validateReservation, createReservation);
   ```

2. **Log trong backend middleware:**
   ```javascript
   // Trong authMiddleware
   console.log('Auth middleware - Token:', req.headers.authorization);
   console.log('Auth middleware - Decoded:', decodedToken);
   console.log('Auth middleware - User:', req.user);
   ```

3. **Kiểm tra user trong database:**
   ```javascript
   // Kiểm tra user có tồn tại và active không
   const user = await User.findById(tokenId);
   console.log('User status:', user.status, user.role, user.isBanned);
   ```

4. **Kiểm tra route permissions:**
   ```javascript
   // Xem route có yêu cầu role gì
   if (req.user.role !== 'customer') {
     return res.status(401).json({ message: 'Authentication required...' });
   }
   ```

## Giải pháp tạm thời (Frontend)

Nếu không thể fix backend ngay, có thể:
1. Hiển thị error message rõ ràng hơn
2. Yêu cầu user đăng xuất và đăng nhập lại
3. Thử gọi API khác để verify token có hoạt động không

## Khuyến nghị

**Vấn đề rõ ràng là ở backend**, vì:
- Frontend đã gửi đúng token với đầy đủ thông tin
- Token không expired
- Headers đúng format
- customerId match

**Cần kiểm tra backend:**
1. Middleware authentication cho `/reservations`
2. Logic verify token
3. User status/role trong database
4. JWT_SECRET có đúng không

