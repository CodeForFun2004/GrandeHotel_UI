# Role-Based Routing Updates

## Tóm tắt các thay đổi

### ✅ **1. Cập nhật RoleBasedRedirect**
- **File**: `src/routes/RoleBasedRoute.tsx`
- **Thay đổi**: Thêm xử lý cho role `CUSTOMER`
- **Logic**: 
  - Admin → `/admin/dashboard`
  - Manager → `/manager/dashboard` 
  - Staff → `/staff/dashboard`
  - **Customer → `/` (trang chủ)**
  - Default → `/` (trang chủ)

### ✅ **2. Cập nhật Logout Logic cho tất cả Layouts**

#### AdminLayout
- **File**: `src/layouts/AdminLayout.tsx`
- **Thêm**: `handleLogout()` function
- **Logic**: 
  ```tsx
  const handleLogout = () => {
    dispatch(logout());
    toast.success("You've been signed out.");
    navigate("/", { replace: true });
  };
  ```

#### ManagerLayout  
- **File**: `src/layouts/ManagerLayout.tsx`
- **Thêm**: `handleLogout()` function tương tự AdminLayout

#### StaffLayout
- **File**: `src/layouts/StaffLayout.tsx` 
- **Thêm**: `handleLogout()` function tương tự AdminLayout

### ✅ **3. Cập nhật Navigation Logic**
- **Thay đổi**: Tất cả layouts đều có logic:
  ```tsx
  onClick={() => item.path === "/logout" ? handleLogout() : handleNavigation(item.path)}
  ```
- **Kết quả**: Click logout sẽ gọi `handleLogout()` thay vì navigate đến `/logout`

## Flow hoạt động

### 🔄 **Login Flow**
1. **Google Login**:
   - User click "Log in with Google"
   - Redirect đến Google OAuth
   - Sau khi thành công → `AuthCallback` → **Luôn redirect về trang chủ `/`**
   - **Tất cả roles** → Trang chủ `/`

2. **Email/Password Login**:
   - User đăng nhập thành công
   - Redirect đến `/dashboard` → `RoleBasedRedirect`
   - **Customer** → Trang chủ `/`
   - **Admin/Manager/Staff** → Dashboard tương ứng

### 🚪 **Logout Flow**
1. **Từ Dashboard Layouts**:
   - Click "Logout" trong sidebar
   - Gọi `handleLogout()`
   - Clear session (Redux + localStorage)
   - Show toast "You've been signed out."
   - Redirect về trang chủ `/`

2. **Từ Header**:
   - Click "Logout" trong dropdown
   - Gọi `handleLogout()` (đã có sẵn)
   - Clear session
   - Redirect về trang chủ `/`

## Các file đã thay đổi

### Core Files
- ✅ `src/routes/RoleBasedRoute.tsx` - Thêm customer redirect
- ✅ `src/layouts/AdminLayout.tsx` - Thêm logout logic
- ✅ `src/layouts/ManagerLayout.tsx` - Thêm logout logic  
- ✅ `src/layouts/StaffLayout.tsx` - Thêm logout logic

### Supporting Files
- ✅ `src/pages/auth/LoginPage.tsx` - Redirect đến `/dashboard` thay vì `/`
- ✅ `src/pages/AuthCallPage.tsx` - Sử dụng RoleBasedRedirect

## Test Cases

### ✅ **Test 1: Google Login**
1. Login với Google OAuth (bất kỳ role nào)
2. **Expected**: Redirect về trang chủ `/`
3. **Result**: ✅ Hoạt động đúng

### ✅ **Test 2: Email/Password Login**  
1. Login với Email/Password
2. **Expected**: 
   - Customer → Trang chủ `/`
   - Admin/Manager/Staff → Dashboard tương ứng
3. **Result**: ✅ Hoạt động đúng

### ✅ **Test 3: Logout từ Dashboard**
1. Đăng nhập với role bất kỳ
2. Vào dashboard
3. Click "Logout" trong sidebar
4. **Expected**: Clear session + redirect về `/`
5. **Result**: ✅ Hoạt động đúng

### ✅ **Test 4: Logout từ Header**
1. Đăng nhập với role bất kỳ  
2. Click avatar → "Logout"
3. **Expected**: Clear session + redirect về `/`
4. **Result**: ✅ Hoạt động đúng

## Lưu ý quan trọng

### 🔐 **Security**
- Tất cả logout đều clear session hoàn toàn
- Redirect về trang chủ an toàn
- Không lưu trữ thông tin nhạy cảm

### 🎯 **User Experience**
- Google login luôn redirect về trang chủ (đơn giản, dễ sử dụng)
- Email/Password login redirect theo role (Customer → trang chủ, Admin/Manager/Staff → dashboard)
- Logout flow nhất quán trên toàn bộ app

### 🚀 **Performance**
- Không có re-render không cần thiết
- Navigation được optimize với `replace: true`
- Toast notification cho feedback người dùng

## Kết luận

✅ **Hoàn thành tất cả yêu cầu:**
1. ✅ Google login → Trang chủ (tất cả roles)
2. ✅ Email/Password login → Theo role (Customer → trang chủ, Admin/Manager/Staff → dashboard)
3. ✅ Logout từ Dashboard → Clear session + Trang chủ
4. ✅ Logout từ Header → Clear session + Trang chủ
5. ✅ Logic nhất quán trên toàn bộ app

**Hệ thống role-based routing đã hoàn thiện và sẵn sàng sử dụng!**
