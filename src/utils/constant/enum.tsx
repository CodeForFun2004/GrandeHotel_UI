export const LOGIN_USER = "login_user";

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  HOTEL_MANAGER: 'hotel-manager', 
  STAFF: 'staff',
  CUSTOMER: 'customer'
} as const;

// Role-based path constants
export const ADMIN_PATHS = {
  DASHBOARD: '/admin/dashboard',
  USER_MANAGEMENT: '/admin/user-management',
  HOTEL_LIST: '/admin/hotel-list',
  PROJECTS: '/admin/projects',
  PROJECTS_CREATE: '/admin/projects/create',
  PROFILE: '/admin/profile'
} as const;

export const MANAGER_PATHS = {
  DASHBOARD: '/manager/dashboard',
  HOTEL_INFO: '/manager/hotel-info',
  ROOMS: '/manager/rooms',
  ROOM_TYPES: '/manager/room-types',
  BOOKINGS: '/manager/bookings',
  STAFF_MANAGEMENT: '/manager/staff',
  PROFILE: '/manager/profile'
} as const;

export const STAFF_PATHS = {
  DASHBOARD: '/staff/dashboard',
  ROOMS: '/staff/rooms',
  BOOKINGS: '/staff/bookings',
  CUSTOMERS: '/staff/customers',
  PROFILE: '/staff/profile'
} as const;