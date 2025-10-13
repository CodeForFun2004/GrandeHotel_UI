# Role-Based Routing System

## Tổng quan

Hệ thống routing đã được cập nhật để hỗ trợ role-based access control với 4 loại user chính:

- **Admin**: Quản lý toàn bộ hệ thống
- **Hotel Manager**: Quản lý khách sạn cụ thể
- **Staff**: Nhân viên khách sạn
- **Customer**: Khách hàng

## Cấu trúc Routing

### 1. Admin Routes (`/admin/*`)
- `/admin/dashboard` - Dashboard tổng quan
- `/admin/user-management` - Quản lý người dùng
- `/admin/hotel-list` - Danh sách khách sạn
- `/admin/projects` - Quản lý dự án
- `/admin/projects/create` - Tạo dự án mới
- `/admin/profile` - Thông tin cá nhân admin

### 2. Manager Routes (`/manager/*`)
- `/manager/dashboard` - Dashboard quản lý
- `/manager/hotel-info` - Thông tin khách sạn
- `/manager/rooms` - Quản lý phòng
- `/manager/bookings` - Quản lý đặt phòng
- `/manager/staff` - Quản lý nhân viên
- `/manager/profile` - Thông tin cá nhân manager

### 3. Staff Routes (`/staff/*`)
- `/staff/dashboard` - Dashboard nhân viên
- `/staff/rooms` - Quản lý phòng
- `/staff/bookings` - Quản lý đặt phòng
- `/staff/customers` - Quản lý khách hàng
- `/staff/profile` - Thông tin cá nhân staff

### 4. Customer Routes
- `/` - Trang chủ
- `/rooms` - Danh sách phòng
- `/book` - Đặt phòng
- `/profile` - Thông tin cá nhân

## Components

### RoleBasedRoute
Component kiểm tra quyền truy cập dựa trên role:
```tsx
<RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN]}>
  <AdminLayout />
</RoleBasedRoute>
```

### RoleBasedRedirect
Component tự động redirect user đến dashboard phù hợp với role:
```tsx
<RoleBasedRedirect />
```

## Layouts

### AdminLayout
- Navigation menu cho admin
- Quản lý user, hotel, projects
- Màu sắc: Primary blue theme

### ManagerLayout
- Navigation menu cho hotel manager
- Quản lý hotel info, rooms, bookings, staff
- Màu sắc: Manager theme

### StaffLayout
- Navigation menu cho staff
- Quản lý rooms, bookings, customers
- Màu sắc: Staff theme

## Authentication Flow

1. User đăng nhập → Lấy thông tin role từ API
2. Hệ thống tự động redirect đến dashboard phù hợp:
   - Admin → `/admin/dashboard`
   - Manager → `/manager/dashboard`
   - Staff → `/staff/dashboard`
   - Customer → `/` (trang chủ)

## Security

- Mỗi route được bảo vệ bởi `PrivateRoute` (kiểm tra authentication)
- `RoleBasedRoute` kiểm tra role cụ thể
- Nếu user không có quyền → redirect về dashboard phù hợp với role
- Legacy route `/dashboard` tự động redirect dựa trên role

## Constants

Tất cả paths được định nghĩa trong `src/utils/constant/enum.tsx`:
- `USER_ROLES`: Các role constants
- `ADMIN_PATHS`: Paths cho admin
- `MANAGER_PATHS`: Paths cho manager
- `STAFF_PATHS`: Paths cho staff

## Usage Example

```tsx
// Trong component
import { useNavigate } from 'react-router-dom';
import { ADMIN_PATHS } from '../utils/constant/enum';

const navigate = useNavigate();
navigate(ADMIN_PATHS.DASHBOARD);
```
