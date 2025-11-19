# PROMPT CHO CURSOR AI - REPO API

## 🎯 **YÊU CẦU CHÍNH:**
Cần implement API endpoints cho Manager role quản lý Room và RoomType để kết nối với UI frontend đã có sẵn.

---

## 📋 **TÌNH TRẠNG UI FRONTEND:**

### ✅ **ĐÃ CÓ SẴN:**
1. **Room Management UI:**
   - `RoomTable.tsx` - Bảng CRUD phòng hoàn chỉnh
   - `RoomFormModal.tsx` - Form tạo/sửa phòng
   - Route: `/manager/rooms`
   - Features: Create, Read, Update, Delete, Search, Filter, Pagination

2. **RoomType Management UI:**
   - `RoomTypeTable.tsx` - Bảng CRUD loại phòng hoàn chỉnh  
   - `RoomTypeFormModal.tsx` - Form tạo/sửa loại phòng
   - Route: `/manager/room-types`
   - Features: Create, Read, Update, Delete, Search, Filter, Pagination

3. **Integration:**
   - RoomFormModal đã được cập nhật để load RoomTypes từ API
   - Manager navigation menu đã có "Room Types"
   - Routing đã được cấu hình

### ❌ **THIẾU:**
- API endpoints thực tế (đang dùng mock data)
- Service calls để kết nối với backend
- Authentication & authorization cho Manager

---

## 🔧 **API ENDPOINTS CẦN IMPLEMENT:**

### **BASE URL CONFIGURATION:**
```typescript
// Frontend đang sử dụng 2 base URLs:
// 1. http://localhost:1000/api (axios instance)
// 2. https://lawohbe.onrender.com (fetch service)

// Khuyến nghị: Sử dụng http://localhost:1000/api cho development
```

### 1. **ROOM MANAGEMENT API:**

```typescript
// Room Model (Frontend đang sử dụng)
interface Room {
  id?: number;
  code: string;           // Mã phòng (unique)
  name: string;           // Tên phòng
  type: string;          // Loại phòng (foreign key to RoomType)
  capacity: number;      // Sức chứa
  pricePerNight: number; // Giá/đêm
  status: 'Active' | 'Inactive' | 'Maintenance';
  // hotelId sẽ được lấy từ JWT token
}

// Required Endpoints:
GET    /api/rooms                    // Lấy danh sách phòng (có filter, search, pagination)
GET    /api/rooms/:id                // Lấy chi tiết phòng
POST   /api/rooms                     // Tạo phòng mới
PUT    /api/rooms/:id                 // Cập nhật phòng
DELETE /api/rooms/:id                 // Xóa phòng
```

### 2. **ROOM TYPE MANAGEMENT API:**

```typescript
// RoomType Model (Frontend đang sử dụng)
interface RoomType {
  id?: number;
  name: string;           // Tên loại phòng (Suite, Deluxe, Family, Classic)
  description?: string;   // Mô tả
  basePrice: number;      // Giá cơ bản
  maxCapacity: number;    // Sức chứa tối đa
  amenities: string[];    // Tiện nghi
  isActive: boolean;      // Trạng thái hoạt động
  // hotelId sẽ được lấy từ JWT token
}

// Required Endpoints:
GET    /api/room-types               // Lấy danh sách loại phòng
GET    /api/room-types/:id           // Lấy chi tiết loại phòng
POST   /api/room-types               // Tạo loại phòng mới
PUT    /api/room-types/:id           // Cập nhật loại phòng
DELETE /api/room-types/:id           // Xóa loại phòng
```

### 3. **FRONTEND API CALLS HIỆN TẠI:**

```typescript
// RoomFormModal.tsx - Load RoomTypes
const loadRoomTypes = async () => {
  // TODO: Replace with actual API call
  // const response = await fetch('/api/room-types');
  // const data = await response.json();
  
  // Mock data for now
  const mockRoomTypes: RoomType[] = [
    { id: 1, name: "Suite", description: "Phòng suite cao cấp", basePrice: 300, maxCapacity: 4, amenities: [], isActive: true },
    { id: 2, name: "Deluxe", description: "Phòng deluxe tiện nghi", basePrice: 200, maxCapacity: 3, amenities: [], isActive: true },
    { id: 3, name: "Family", description: "Phòng gia đình", basePrice: 180, maxCapacity: 6, amenities: [], isActive: true },
    { id: 4, name: "Classic", description: "Phòng classic", basePrice: 120, maxCapacity: 2, amenities: [], isActive: true },
  ];
  
  setRoomTypes(mockRoomTypes.filter(rt => rt.isActive));
};

// RoomTable.tsx - Room CRUD operations
const handleSubmit = (room: Room) => {
  if (editing) {
    // TODO: PUT /api/rooms/:id
    setRooms((prev) => prev.map((r) => (r.id === editing.id ? { ...room, id: editing.id } : r)));
    toast.success("Cập nhật phòng thành công (mock)");
  } else {
    // TODO: POST /api/rooms
    const id = Math.max(0, ...rooms.map((r) => r.id ?? 0)) + 1;
    setRooms((prev) => [{ ...room, id }, ...prev]);
    toast.success("Thêm phòng thành công (mock)");
  }
};

// RoomTypeTable.tsx - RoomType CRUD operations
const handleSubmit = (roomType: RoomType) => {
  if (editing) {
    // TODO: PUT /api/room-types/:id
    setRoomTypes((prev) => prev.map((rt) => (rt.id === editing.id ? { ...roomType, id: editing.id } : rt)));
    toast.success("Cập nhật loại phòng thành công (mock)");
  } else {
    // TODO: POST /api/room-types
    const id = Math.max(0, ...roomTypes.map((rt) => rt.id ?? 0)) + 1;
    setRoomTypes((prev) => [{ ...roomType, id }, ...prev]);
    toast.success("Thêm loại phòng thành công (mock)");
  }
};
```

---

## 🔐 **AUTHORIZATION & PERMISSIONS:**

### **Frontend Authentication Configuration:**
```typescript
// src/api/axios.ts - Axios instance configuration
export const instance = axios.create({
  baseURL: 'http://localhost:1000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - Auto add Bearer token
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// src/services/fetch.tsx - Alternative fetch service
export const axiosInstance = axios.create({
  baseURL: "https://lawohbe.onrender.com"
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem(LOGIN_USER);
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});
```

### **Manager Role Requirements:**
- Manager chỉ có thể quản lý rooms/roomtypes của hotel mình
- Middleware kiểm tra hotelId trong JWT token
- Validation: Manager phải thuộc về hotel đó
- Role-based access control

### **Authentication Flow:**
```typescript
// JWT Token Structure cần có:
interface JWTPayload {
  userId: number;
  role: 'hotel-manager';
  hotelId: number;  // Quan trọng: Manager chỉ truy cập hotel này
  permissions: string[];
}

// Frontend đang sử dụng 2 token storage keys:
// 1. 'accessToken' (axios instance)
// 2. 'login_user' (fetch service)
// Khuyến nghị: Standardize về 'accessToken'
```

---

## 📊 **FILTERING & SEARCH REQUIREMENTS:**

### **Rooms API - Frontend Implementation:**
```typescript
// RoomTable.tsx - Current filtering logic
const [keyword, setKeyword] = useState("");           // Search by code/name
const [typeFilter, setTypeFilter] = useState<string>("All");  // Filter by type
const [statusFilter, setStatusFilter] = useState<string>("All"); // Filter by status
const [page, setPage] = useState(1);
const pageSize = 5;

// Query Parameters cần support:
GET /api/rooms?page=1&limit=5&search=suite&type=Suite&status=Active

// Response Format:
interface RoomsResponse {
  data: Room[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message: string;
  success: boolean;
}
```

### **RoomTypes API - Frontend Implementation:**
```typescript
// RoomTypeTable.tsx - Current filtering logic
const [keyword, setKeyword] = useState("");           // Search by name/description
const [statusFilter, setStatusFilter] = useState<string>("All"); // Filter by isActive
const [page, setPage] = useState(1);
const pageSize = 5;

// Query Parameters cần support:
GET /api/room-types?page=1&limit=5&search=suite&isActive=true

// Response Format:
interface RoomTypesResponse {
  data: RoomType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message: string;
  success: boolean;
}
```

### **Frontend Filter Implementation:**
```typescript
// RoomTable.tsx - Filter logic
const filtered = useMemo(() => {
  return rooms.filter((r) => {
    const matchesKw = [r.code, r.name].some((v) => v.toLowerCase().includes(keyword.toLowerCase()));
    const matchesType = typeFilter === "All" || r.type === (typeFilter as any);
    const matchesStatus = statusFilter === "All" || r.status === (statusFilter as any);
    return matchesKw && matchesType && matchesStatus;
  });
}, [rooms, keyword, typeFilter, statusFilter]);

// RoomTypeTable.tsx - Filter logic
const filtered = useMemo(() => {
  return roomTypes.filter((rt) => {
    const matchesKw = rt.name.toLowerCase().includes(keyword.toLowerCase()) ||
                     rt.description?.toLowerCase().includes(keyword.toLowerCase());
    const matchesStatus = statusFilter === "All" || 
                         (statusFilter === "Active" && rt.isActive) ||
                         (statusFilter === "Inactive" && !rt.isActive);
    return matchesKw && matchesStatus;
  });
}, [roomTypes, keyword, statusFilter]);
```

---

## 🎯 **SPECIFIC FEATURES NEEDED:**

### **1. Room Management:**
- ✅ CRUD operations
- ✅ Search by code/name
- ✅ Filter by type, status
- ✅ Pagination
- ✅ Manager chỉ thấy rooms của hotel mình
- ✅ Validation: code unique trong hotel
- ✅ Price validation (phải > 0)

### **2. RoomType Management:**
- ✅ CRUD operations  
- ✅ Search by name/description
- ✅ Filter by isActive
- ✅ Pagination
- ✅ Manager chỉ thấy roomtypes của hotel mình
- ✅ Amenities management (array of strings)
- ✅ Validation: name unique trong hotel

### **3. Integration Features:**
- ✅ Room form load RoomTypes từ API
- ✅ RoomType dropdown hiển thị: "Suite - $300 (4 người)"
- ✅ Error handling và loading states
- ✅ Toast notifications

## 🔧 **DETAILED ENDPOINT SPECIFICATIONS:**

### **Room Endpoints:**
```typescript
// 1. GET /api/rooms - List rooms with filtering
// Query params: page, limit, search, type, status
// Response: { data: Room[], pagination: {...}, message: string, success: boolean }

// 2. GET /api/rooms/:id - Get room by ID
// Response: { data: Room, message: string, success: boolean }

// 3. POST /api/rooms - Create new room
// Body: { code: string, name: string, type: string, capacity: number, pricePerNight: number, status: string }
// Response: { data: Room, message: string, success: boolean }

// 4. PUT /api/rooms/:id - Update room
// Body: { code: string, name: string, type: string, capacity: number, pricePerNight: number, status: string }
// Response: { data: Room, message: string, success: boolean }

// 5. DELETE /api/rooms/:id - Delete room
// Response: { message: string, success: boolean }
```

### **RoomType Endpoints:**
```typescript
// 1. GET /api/room-types - List room types with filtering
// Query params: page, limit, search, isActive
// Response: { data: RoomType[], pagination: {...}, message: string, success: boolean }

// 2. GET /api/room-types/:id - Get room type by ID
// Response: { data: RoomType, message: string, success: boolean }

// 3. POST /api/room-types - Create new room type
// Body: { name: string, description?: string, basePrice: number, maxCapacity: number, amenities: string[], isActive: boolean }
// Response: { data: RoomType, message: string, success: boolean }

// 4. PUT /api/room-types/:id - Update room type
// Body: { name: string, description?: string, basePrice: number, maxCapacity: number, amenities: string[], isActive: boolean }
// Response: { data: RoomType, message: string, success: boolean }

// 5. DELETE /api/room-types/:id - Delete room type
// Response: { message: string, success: boolean }
```

### **Frontend Service Integration:**
```typescript
// Cần tạo service functions để replace mock data:

// RoomService.ts
export const roomService = {
  getRooms: (params: { page: number, limit: number, search?: string, type?: string, status?: string }) => 
    instance.get('/rooms', { params }),
  
  getRoom: (id: number) => 
    instance.get(`/rooms/${id}`),
  
  createRoom: (room: Room) => 
    instance.post('/rooms', room),
  
  updateRoom: (id: number, room: Room) => 
    instance.put(`/rooms/${id}`, room),
  
  deleteRoom: (id: number) => 
    instance.delete(`/rooms/${id}`)
};

// RoomTypeService.ts
export const roomTypeService = {
  getRoomTypes: (params: { page: number, limit: number, search?: string, isActive?: boolean }) => 
    instance.get('/room-types', { params }),
  
  getRoomType: (id: number) => 
    instance.get(`/room-types/${id}`),
  
  createRoomType: (roomType: RoomType) => 
    instance.post('/room-types', roomType),
  
  updateRoomType: (id: number, roomType: RoomType) => 
    instance.put(`/room-types/${id}`, roomType),
  
  deleteRoomType: (id: number) => 
    instance.delete(`/room-types/${id}`)
};
```

---

## 🚨 **VALIDATION RULES:**

### **Room Validation:**
```typescript
// Required fields: code, name, type, capacity, pricePerNight, status
// Business rules:
- code: unique trong hotel
- capacity: > 0
- pricePerNight: > 0
- type: phải tồn tại trong RoomTypes của hotel
- status: enum ['Active', 'Inactive', 'Maintenance']
```

### **RoomType Validation:**
```typescript
// Required fields: name, basePrice, maxCapacity, isActive
// Business rules:
- name: unique trong hotel
- basePrice: > 0
- maxCapacity: > 0
- amenities: array of strings
- isActive: boolean
```

---

## 📝 **ERROR HANDLING:**

### **Standard Error Response:**
```typescript
interface ErrorResponse {
  success: false;
  message: string;
  errors?: {
    field: string;
    message: string;
  }[];
  code?: string;
}
```

### **Common Error Scenarios:**
- 400: Validation errors
- 401: Unauthorized (invalid token)
- 403: Forbidden (không có quyền truy cập hotel này)
- 404: Resource not found
- 409: Conflict (duplicate code/name)
- 500: Server error

---

## 🔄 **IMPLEMENTATION PRIORITY:**

### **Phase 1 - Core CRUD:**
1. ✅ RoomType CRUD endpoints
2. ✅ Room CRUD endpoints
3. ✅ Basic authentication middleware
4. ✅ Hotel-based authorization

### **Phase 2 - Advanced Features:**
1. ✅ Search & filter functionality
2. ✅ Pagination
3. ✅ Error handling
4. ✅ Validation rules

### **Phase 3 - Integration:**
1. ✅ Frontend service calls
2. ✅ Loading states
3. ✅ Error handling in UI
4. ✅ Toast notifications

---

## 📋 **TESTING REQUIREMENTS:**

### **API Testing:**
- ✅ Test all CRUD operations
- ✅ Test authorization (Manager chỉ truy cập hotel mình)
- ✅ Test validation rules
- ✅ Test search & filter
- ✅ Test pagination
- ✅ Test error scenarios

### **Integration Testing:**
- ✅ Frontend-backend integration
- ✅ Authentication flow
- ✅ Error handling
- ✅ Loading states

---

## 🎯 **DELIVERABLES:**

1. **API Endpoints** - Đầy đủ CRUD cho Room và RoomType
2. **Authentication** - JWT-based với hotel authorization
3. **Validation** - Business rules và error handling
4. **Documentation** - API docs với examples
5. **Testing** - Unit tests và integration tests

---

## 📞 **COMMUNICATION:**

**Frontend Status:** ✅ **READY** - UI hoàn chỉnh, chỉ cần API
**Backend Status:** ❌ **NEEDED** - Cần implement endpoints
**Integration:** 🔄 **PENDING** - Chờ API để connect

**Next Steps:** Implement API endpoints theo specifications trên, sau đó frontend sẽ connect và test integration.

---

**Lưu ý:** Frontend đã có đầy đủ UI/UX, chỉ cần API backend để hoàn thiện hệ thống quản lý phòng và loại phòng cho Manager role.
