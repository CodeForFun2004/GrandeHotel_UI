# Debug Login Issues

## Vấn đề hiện tại
- Không thể đăng nhập bằng Google OAuth
- Không thể đăng nhập bằng email/password thông thường
- Lỗi: `http://localhost:1000/api/auth/google`

## Nguyên nhân có thể

### 1. Backend Server không chạy
- **Kiểm tra**: Backend server có đang chạy trên port 1000 không?
- **Giải pháp**: Khởi động backend server

### 2. Environment Variables
- **Vấn đề**: `VITE_API_URL` không được set
- **Giải pháp**: Tạo file `.env` trong root project:
```env
VITE_API_URL=http://localhost:1000/api
```

### 3. CORS Issues
- **Vấn đề**: Backend không cho phép CORS từ frontend
- **Giải pháp**: Cấu hình CORS trên backend

### 4. Google OAuth Configuration
- **Vấn đề**: Google OAuth chưa được cấu hình đúng trên backend
- **Giải pháp**: Kiểm tra Google OAuth setup trên backend

## Cách debug

### Bước 1: Kiểm tra Backend
```bash
# Kiểm tra backend có chạy không
curl http://localhost:1000/api/health
```

### Bước 2: Kiểm tra Environment
- Mở DevTools Console
- Chạy: `console.log(import.meta.env.VITE_API_URL)`
- Nếu undefined → cần tạo file `.env`

### Bước 3: Sử dụng Debug Component
1. Import `ApiDebugComponent` vào một trang
2. Chạy test API connection
3. Xem kết quả để xác định vấn đề

### Bước 4: Kiểm tra Network Tab
1. Mở DevTools → Network tab
2. Thử đăng nhập
3. Xem có request nào failed không
4. Kiểm tra CORS errors

## Các thay đổi đã thực hiện

### 1. Cập nhật LoginPage
- Thêm error handling cho Google login
- Thêm console.log để debug
- Cập nhật redirect sau login thành công

### 2. Cập nhật AuthCallback
- Thêm error handling
- Sử dụng RoleBasedRedirect thay vì navigate('/')
- Thêm loading states

### 3. Tạo Debug Components
- `ApiDebugComponent`: Test API connection
- `RoleTestComponent`: Test role-based navigation

## Cách test

### Test 1: Regular Login
1. Điền email/password
2. Click Login
3. Kiểm tra console logs
4. Xem có redirect đến dashboard không

### Test 2: Google Login
1. Click "Log in with Google"
2. Kiểm tra URL redirect
3. Xem có lỗi CORS không
4. Kiểm tra backend logs

### Test 3: Role-based Routing
1. Login với role khác nhau
2. Kiểm tra redirect đến đúng dashboard
3. Test navigation giữa các routes

## Troubleshooting Commands

```bash
# Kiểm tra port 1000 có bị chiếm không
netstat -ano | findstr :1000

# Kiểm tra backend logs
# (tùy thuộc vào cách bạn chạy backend)

# Restart development server
npm run dev
# hoặc
yarn dev
```

## Next Steps

1. **Kiểm tra backend server** - Đảm bảo chạy trên port 1000
2. **Tạo file .env** - Set VITE_API_URL
3. **Test API connection** - Sử dụng debug component
4. **Kiểm tra CORS** - Backend phải allow frontend origin
5. **Test Google OAuth** - Đảm bảo backend có Google OAuth setup

## Liên hệ

Nếu vẫn gặp vấn đề, hãy:
1. Chạy debug component và gửi kết quả
2. Kiểm tra backend logs
3. Kiểm tra browser console errors
4. Cung cấp thông tin về backend setup
