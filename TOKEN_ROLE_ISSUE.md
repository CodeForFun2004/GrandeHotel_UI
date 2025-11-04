# Token Role Issue - Vấn đề thiếu Role trong Token

## Vấn đề

Khi refresh token, token mới từ backend **không có `role` field**, trong khi backend middleware yêu cầu `role` trong token để authorize requests.

### Chi tiết:

1. **Token ban đầu (từ login)**: Có thể có hoặc không có `role` (tùy backend)
2. **Token mới (từ refresh endpoint `/api/auth/refresh`)**: Chỉ có `['id', 'iat', 'exp']` - **thiếu `role`**
3. **Backend middleware**: Kiểm tra `role` trong token → nếu không có → reject với 401

### Logs chứng minh:

```
✅ Decoded NEW token payload: {
  id: '68e5d4dc5330fe88ef797299',
  role: undefined,  // ❌ THIẾU
  email: undefined,
  allFields: ['id', 'iat', 'exp']
}

⚠️ Token missing "role" field - backend may require role in token for authorization
```

## Nguyên nhân

**Backend refresh token endpoint** (`/api/auth/refresh`) không include `role` khi tạo token mới.

## Giải pháp

### Giải pháp 1: Fix Backend (Khuyến nghị) ⭐

Backend cần sửa refresh token endpoint để include `role` trong token payload:

```javascript
// Backend: /api/auth/refresh
const newAccessToken = jwt.sign(
  {
    id: user.id,
    role: user.role,  // ✅ CẦN THÊM FIELD NÀY
    // ... other fields
  },
  JWT_SECRET,
  { expiresIn: '15m' }
);
```

### Giải pháp 2: Workaround Frontend (Tạm thời)

Frontend đã được cập nhật để:
1. Detect khi token thiếu `role`
2. Hiển thị thông báo rõ ràng cho user
3. Yêu cầu user đăng xuất và đăng nhập lại (để lấy token mới có role)

### Giải pháp 3: Backend không yêu cầu role trong token

Nếu backend có thể lấy `role` từ database dựa vào `id` trong token, thì không cần `role` trong token. Nhưng hiện tại backend đang reject nên có vẻ như backend yêu cầu `role` trong token.

## Các file đã sửa

1. `src/api/axios.ts`:
   - Thêm logging để detect token thiếu role
   - Warning khi token thiếu role sau refresh

2. `src/pages/ReservationReview.tsx`:
   - Kiểm tra token có role không khi bị 401
   - Hiển thị error message rõ ràng nếu thiếu role

## Test

1. Login và tạo reservation → Nếu token ban đầu có role → OK
2. Đợi token expire hoặc force refresh
3. Sau khi refresh, token mới thiếu role
4. Request bị 401 với message: "Authentication required to create reservation"
5. Frontend detect và hiển thị: "Token không chứa thông tin quyền (role). Vui lòng đăng xuất và đăng nhập lại."

## Khuyến nghị

**Fix backend** là giải pháp tốt nhất. Backend refresh token endpoint cần include `role` trong token payload để đảm bảo token mới có đầy đủ thông tin cần thiết cho authorization.

