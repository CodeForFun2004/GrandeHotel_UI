import instance from './axios';

export interface RevenueData {
  month: string;
  revenue: number;
  bookings: number;
}

export interface HotelPerformance {
  id: string;
  name: string;
  revenue: number;
  occupancy: number;
  status: string;
}

export interface BookingStatus {
  name: string;
  value: number;
  color: string;
}

export interface UserStats {
  role: string;
  count: number;
  newThisMonth: number;
}

export interface StatsSummary {
  totalHotels: number;
  totalRooms: number;
  totalUsers: number;
  totalRevenue: number;
}

// ============ Staff Check-in/Checkout Types ============
export interface CheckinSearchItem {
  id: string;
  customer: {
    _id: string;
    fullname: string;
    phone?: string;
    email?: string;
  };
  hotel: { _id: string; name: string };
  checkInDate: string;
  checkOutDate: string;
  paymentStatus: 'unpaid' | 'partially_paid' | 'deposit_paid' | 'fully_paid';
  details: Array<{ roomType: { _id: string; name: string }; quantity: number }>;
}

export interface CheckinSearchResponse { results: CheckinSearchItem[] }

export interface CheckinReservationDetail {
  reservation: {
    _id: string;
    hotel: string | { _id: string; name: string };
    customer: string | { _id: string; fullname: string; phone?: string; email?: string };
    checkInDate: string;
    checkOutDate: string;
  };
  payment?: {
    paymentStatus: 'unpaid' | 'partially_paid' | 'deposit_paid' | 'fully_paid';
    depositAmount: number;
    totalPrice: number;
    paidAmount: number;
  } | null;
  details: Array<{
    roomType: { _id: string; name: string };
    quantity: number;
    reservedRooms?: Array<{ _id: string; roomNumber: string; name?: string; status?: string }>;
  }>;
  suggestions: Array<{
    roomType: { _id: string; name: string };
    requiredQuantity: number;
    suggestedRooms: Array<{ _id: string; roomNumber: string; name?: string; status?: string }>;
    source: 'reserved' | 'available';
  }>;
}

export interface ConfirmCheckinRequest {
  selections?: Array<{ roomTypeId: string; roomIds: string[] }>;
  idVerifications?: Array<{
    roomId: string;
    idDocument: {
      // Accept Vietnam ID variants directly; backend also supports 'other'
      type?: 'cccd' | 'cmnd' | 'passport' | 'other';
      number: string;
      nameOnId: string;
      address?: string;
      images?: Array<{ publicId: string; url: string }>;
      method?: 'manual' | 'face';
      faceScore?: number;
    };
  }>;
}

export interface ConfirmCheckinResponse {
  message: string;
  stay: {
    _id: string;
    reservation: string;
    hotel: string;
    status: string;
    actualCheckIn: string;
  };
}

// ============ Staff Check-out APIs/Types ============
export interface CheckoutFindRoomResponse {
  stayId: string;
  hotel: { _id: string; name: string };
  room: { id: string; roomNumber: string; name?: string };
  reservation: { _id: string; checkInDate: string; checkOutDate: string };
  breakdown: {
    nights: number;
    nightsPrice: number;
    nightsDue: number;
    servicesCost: number;
    amountDue: number;
  };
}

export interface InHouseStayItem {
  stayId: string;
  roomId: string;
  guestName: string;
  phone: string;
  email: string;
  roomType: string;
  roomNumber: string;
  checkIn: string | Date;
  checkOutPlan: string | Date;
  pricePerNight: number;
  nightsSoFar: number;
  deposit: number;
}

export interface ListInHouseResponse { inHouse: InHouseStayItem[] }

export interface CreateCheckoutPaymentBody {
  paymentMethod?: 'cash' | 'card' | 'qr';
  roomId?: string;
}

export interface CreateCheckoutPaymentResponse {
  message: string;
  checkout: {
    stayId: string;
    amountDue: number;
    nights: number;
    nightsPrice: number;
    nightsDue: number;
    servicesCost: number;
    description: string;
    suggestedPaymentMethod: string;
    vietQRLink?: string | null;
    requiresPayment: boolean;
  };
}

export interface VerifyCheckoutPaymentResponse {
  message: string;
  amountDue?: number;
  payment?: { paymentStatus: string; paidAmount: number; totalPrice: number; depositAmount: number };
}

export interface ConfirmCheckoutBody {
  paymentId?: string;
  status?: 'Success' | 'Failed';
  amountPaid?: number;
  paymentMethod?: 'cash' | 'card' | 'qr';
  roomId?: string;
}

export interface ConfirmCheckoutResponse {
  message: string;
  stayId: string;
}


// Dashboard API calls
export const getDashboardStats = async (): Promise<StatsSummary> => {
  const res = await instance.get('/dashboard/stats');
  return res.data;
};

export const getRevenueData = async (): Promise<RevenueData[]> => {
  const res = await instance.get('/dashboard/revenue');
  return res.data;
};

export const getHotelPerformance = async (): Promise<HotelPerformance[]> => {
  const res = await instance.get('/dashboard/hotels/performance');
  return res.data;
};

export const getBookingStatus = async (): Promise<BookingStatus[]> => {
  const res = await instance.get('/dashboard/bookings/status');
  return res.data;
};

export const getUserStats = async (): Promise<UserStats[]> => {
  const res = await instance.get('/dashboard/users/stats');
  return res.data;
};

// ============ Staff Check-in APIs ============
export const searchReservationsForCheckIn = async (
  query: string,
  opts?: { checkInDate?: string; todayOnly?: boolean }
): Promise<CheckinSearchResponse> => {
  const params: any = { };
  if (query != null) params.query = query;
  if (opts?.checkInDate) params.checkInDate = opts.checkInDate;
  if (opts?.todayOnly != null) params.todayOnly = String(opts.todayOnly);
  const res = await instance.get('/dashboard/checkin/search', { params });
  return res.data;
};

export const getReservationForCheckIn = async (
  id: string
): Promise<CheckinReservationDetail> => {
  const res = await instance.get(`/dashboard/checkin/${id}`);
  return res.data;
};

export const confirmCheckIn = async (
  id: string,
  body?: ConfirmCheckinRequest
): Promise<ConfirmCheckinResponse> => {
  const res = await instance.post(`/dashboard/checkin/${id}/confirm`, body || {});
  return res.data;
};

// Checkout
export const findStayByRoomNumber = async (
  roomNumber: string
): Promise<CheckoutFindRoomResponse> => {
  const res = await instance.get('/dashboard/checkout/find-room', { params: { roomNumber } });
  return res.data;
};

export const createCheckoutPayment = async (
  stayId: string,
  body?: CreateCheckoutPaymentBody
): Promise<CreateCheckoutPaymentResponse> => {
  const res = await instance.post(`/dashboard/checkout/${stayId}/create-payment`, body || {});
  return res.data;
};

export const verifyCheckoutPayment = async (
  stayId: string
): Promise<VerifyCheckoutPaymentResponse> => {
  const res = await instance.post(`/dashboard/checkout/${stayId}/verify-payment`);
  return res.data;
};

export const confirmCheckout = async (
  stayId: string,
  body?: ConfirmCheckoutBody
): Promise<ConfirmCheckoutResponse> => {
  const res = await instance.post(`/dashboard/checkout/${stayId}/confirm`, body || {});
  return res.data;
};

export const listInHouseStays = async (
  query?: string
): Promise<ListInHouseResponse> => {
  const params: any = {};
  if (query && query.trim()) params.query = query.trim();
  const res = await instance.get('/dashboard/checkout/inhouse', { params });
  return res.data;
};

export default {
  getDashboardStats,
  getRevenueData,
  getHotelPerformance,
  getBookingStatus,
  getUserStats,
  // Staff check-in
  searchReservationsForCheckIn,
  getReservationForCheckIn,
  confirmCheckIn,
  // Staff check-out
  findStayByRoomNumber,
  createCheckoutPayment,
  verifyCheckoutPayment,
  confirmCheckout,
  listInHouseStays,
};
