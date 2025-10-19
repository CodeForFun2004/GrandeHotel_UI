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
  images?: string[];
  rating?: number; // average rating
  services?: Array<Service | string>;
  roomTypes?: Array<RoomType | string>;
  rooms?: Array<Room | string>;
  createdAt?: string;
  updatedAt?: string;
  // optional fields returned by search API
  minPricePerNight?: number;
  images?: string[];
}

export interface ReservationDetail {
  _id?: string;
  id?: string;
  reservationId?: string;
  room?: Room | string;
  roomType?: RoomType | string;
  price?: number; // price per night for this detail
  nights?: number;
  guests?: number;
  subtotal?: number; // price * nights + extras
  extras?: Array<Service | string>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Reservation {
  _id?: string;
  id?: string;
  bookingNumber?: string;
  userId?: string;
  hotel?: Hotel | string;
  details?: ReservationDetail[];
  checkIn?: string; // ISO date
  checkOut?: string; // ISO date
  totalAmount?: number;
  status?:
    | 'pending'
    | 'confirmed'
    | 'checked-in'
    | 'checked-out'
    | 'cancelled'
    | 'no-show'
    | 'completed';
  paymentStatus?: 'unpaid' | 'paid' | 'refunded' | 'partial';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
