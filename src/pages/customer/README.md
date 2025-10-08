# Profile Page Components

Trang Profile đã được tách thành các component nhỏ hơn để dễ quản lý và bảo trì.

## Cấu trúc thư mục

```
src/pages/customer/
├── Profile.tsx                    # Component chính
├── components/                    # Các component con
│   ├── ProfileSidebar.tsx        # Sidebar với menu navigation
│   ├── ProfileHeader.tsx         # Header với avatar và edit button
│   ├── ProfileForm.tsx           # Form thông tin cá nhân
│   ├── ChangePasswordForm.tsx   # Form đổi mật khẩu
│   └── AvatarUpload.tsx          # Component upload avatar
├── types/
│   └── profile.types.ts          # Type definitions
├── constants/
│   └── profile.constants.ts      # Constants và styles
└── README.md                     # File này
```

## Các component

### 1. ProfileSidebar
- Quản lý sidebar với menu navigation
- Hiển thị thông tin user (avatar, name, role)
- Các menu items: Personal Data, Payment Account, Trips, etc.

### 2. ProfileHeader
- Header chính với avatar và edit button
- Tích hợp AvatarUpload component
- Chỉ hiển thị edit button khi ở tab Profile và không đang edit

### 3. ProfileForm
- Form thông tin cá nhân (First Name, Last Name, Email, etc.)
- Hỗ trợ chế độ edit/readonly
- Actions: Discard, Save changes

### 4. ChangePasswordForm
- Form đổi mật khẩu với validation
- Hiển thị/ẩn password với eye icon
- Error handling và success message

### 5. AvatarUpload
- **FIXED BUG**: Upload avatar đồng bộ ngay lập tức
- Preview ảnh ngay khi chọn file
- Upload thật lên server và cập nhật Redux
- Error handling và loading state

## Bug fixes

### Upload Avatar Bug Fix
- **Trước**: Avatar chỉ hiển thị sau khi upload xong và toast hiện
- **Sau**: Avatar hiển thị ngay lập tức khi chọn file, đồng bộ với upload process
- Sử dụng `URL.createObjectURL()` để preview tạm thời
- Cập nhật Redux state khi upload thành công
- Revert về avatar cũ nếu upload thất bại

## Types và Constants

### profile.types.ts
- `Account`: Interface cho thông tin user
- `Tab`: Type cho các tab (profile, change)
- `PasswordState`: State cho form đổi mật khẩu
- `ShowPasswordState`: State cho hiển thị/ẩn password

### profile.constants.ts
- `SEED`: Dữ liệu mẫu
- `DEFAULT_AVATAR`: Avatar mặc định
- Các style constants (LABEL, WRAP, INPUT, etc.)

## Cách sử dụng

```tsx
import Profile from './pages/customer/Profile';

// Sử dụng component chính
<Profile />
```

Tất cả logic đã được tách thành các component riêng biệt, giúp code dễ đọc, dễ bảo trì và có thể tái sử dụng.
