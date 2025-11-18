// Auto-generated UI types mirroring backend models (Hotel, RoomType, Room,
// Reservation, ReservationDetail, Service). Keep fields optional when
// uncertain and use string IDs for relations to be flexible with API shapes.

export interface Service {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  basePrice?: number; // some backend APIs use `basePrice`
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoomType {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
  description?: string;
  capacity?: number; // number of guests
  price?: number; // base price per night
  images?: string[];
  amenities?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Room {
  _id?: string;
  id?: string;
  roomNumber?: string;
  floor?: number;
  status?: 'available' | 'booked' | 'maintenance' | 'out-of-service';
  roomType?: RoomType | string; // nested object or id
  price?: number;
  images?: string[];
  hotel?: Hotel | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Hotel {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
  address?: string;
  city?: string;
  country?: string;
  description?: string;
  email?: string;
  phone?: string;
  manager?: User | string;
  status?: 'available' | 'full' | 'closed';
  images?: string[];
  amenities?: string[];
  rating?: number; // average rating
  services?: Array<Service | string>;
  roomTypes?: Array<RoomType | string>;
  rooms?: Array<Room | string>;
  createdAt?: string;
  updatedAt?: string;
  // optional fields returned by search API
  minPricePerNight?: number;
}

export interface User {
  _id?: string;
  id?: string;
  username: string;
  fullname: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin' | 'staff' | 'hotel-manager';
  avatar?: string;
  address?: string;
  gender?: 'male' | 'female' | 'other';
  birthday?: string;
  country?: string;
  status?: string;
  hotelId?: string;
  isBanned?: boolean;
  banReason?: string;
  banExpires?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReservationDetail {
  _id?: string;
  id?: string;
  reservation?: string; // Reservation ID
  roomType?: RoomType | string;
  quantity?: number;
  adults?: number;
  children?: number;
  infants?: number;
  services?: Array<{ service: Service | string; quantity: number }>;
  reservedRooms?: Array<Room | string>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  _id?: string;
  id?: string;
  reservation?: string;
  totalPrice?: number;
  depositAmount?: number;
  paymentStatus?: 'unpaid' | 'deposit_paid' | 'fully_paid' | 'partially_paid' | 'refunded';
  paidAmount?: number;
  paymentMethod?: 'bank_transfer' | 'cash' | 'card' | 'other';
  paymentNotes?: string;
  remainingAmount?: number;
  isFullyPaid?: boolean;
  hasDeposit?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Reservation {
  _id?: string;
  id?: string;
  hotel?: Hotel | string;
  customer?: User | string;
  checkInDate?: string; // ISO date
  checkOutDate?: string; // ISO date
  numberOfGuests?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'canceled' | 'completed';
  stayStatus?: 'not_checked_in' | 'checked_in' | 'checked_out';
  checkedInAt?: string;
  checkedOutAt?: string;
  checkedInBy?: User | string;
  checkedOutBy?: User | string;
  qrCodeToken?: string;
  reason?: string;
  details?: ReservationDetail[];
  payment?: Payment;
  createdAt?: string;
  updatedAt?: string;
}

export interface Contact {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  subject?: 'room-price' | 'services' | 'events' | 'complaint' | 'reservation' | 'other';
  status?: 'pending' | 'processed' | 'ignored';
  createdAt?: string;
  updatedAt?: string;
}

export interface Voucher {
  _id?: string;
  id?: string;
  code: string; // unique, uppercase, trimmed, required
  name: string; // required
  description?: string;
  discountType: 'percent' | 'fixed'; // required: enum ['percent', 'fixed']
  discountValue: number; // required
  maxDiscount?: number | null; // max discount for percent type, default null (0 = no limit)
  minBookingValue?: number; // default 0
  scope?: 'global' | 'multi-hotel'; // default 'global', enum ['global', 'multi-hotel']
  hotelIds?: Array<string | Hotel>; // array of hotel ObjectIds or populated hotels (for multi-hotel scope)
  startDate: string | Date; // required: ISO date
  endDate: string | Date; // required: ISO date
  maxUsageGlobal?: number; // default 0 (0 = unlimited)
  maxUsagePerUser?: number; // default 0 (0 = unlimited per user)
  status?: 'active' | 'inactive'; // default 'active', enum ['active', 'inactive']
  isLock?: boolean; // default false - allows admin to lock voucher (prevent usage but keep for history)
  createdBy?: string | User; // User ObjectId or populated user
  createdAt?: string;
  updatedAt?: string;
}