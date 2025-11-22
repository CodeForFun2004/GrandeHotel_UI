import instance from './axios';

// Manager Dashboard API
export interface KPIData {
  totalBookings: number;
  revenue: number;
  occupancy: number;
  adr: number;
}

export interface RevenueSeriesItem {
  label: string;
  value: number;
}

export interface BookingStatusItem {
  status: string;
  value: number;
}

export interface TopServiceItem {
  name: string;
  revenue: number;
}

export const getManagerKPIs = async (params?: { from?: string; to?: string }) => {
  const res = await instance.get<{ success: boolean; data: KPIData }>('/manager/dashboard/kpis', { params });
  return res.data;
};

export const getManagerRevenueSeries = async (params?: { groupBy?: 'day' | 'month'; from?: string; to?: string }) => {
  const res = await instance.get<{ success: boolean; data: RevenueSeriesItem[] }>('/manager/dashboard/revenue-series', { params });
  return res.data;
};

export const getManagerBookingStatus = async (params?: { from?: string; to?: string }) => {
  const res = await instance.get<{ success: boolean; data: BookingStatusItem[] }>('/manager/dashboard/booking-status', { params });
  return res.data;
};

export const getManagerTopServices = async (params?: { from?: string; to?: string }) => {
  const res = await instance.get<{ success: boolean; data: TopServiceItem[] }>('/manager/dashboard/top-services', { params });
  return res.data;
};

// Staff Check-in APIs
export interface CheckinSearchItem {
  _id: string;
  id?: string;
  customer?: {
    _id?: string;
    fullname?: string;
    phone?: string;
    email?: string;
  };
  hotel?: {
    _id?: string;
    name?: string;
  };
  checkInDate?: string;
  checkOutDate?: string;
  numberOfGuests?: number;
  status?: string;
  stayStatus?: string;
  payment?: {
    paymentStatus?: string;
    totalPrice?: number;
    paidAmount?: number;
  };
}


// Additional interfaces from commit 57d0e0c
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

// Additional interfaces for check-in/check-out from commit 57d0e0c
export interface BookingStats {
  occupancy: number;
  status: string;
}

export interface CheckinSearchItemOld {
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

export interface CheckinSearchResponse { results: CheckinSearchItemOld[] }

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




export const searchReservationsForCheckIn = async (
  query: string,
  opts?: { checkInDate?: string; todayOnly?: boolean; room?: string }
): Promise<CheckinSearchResponse> => {
  const params: any = { };
  if (query != null) params.query = query;
  if (opts?.checkInDate) params.checkInDate = opts.checkInDate;
  if (opts?.todayOnly != null) params.todayOnly = String(opts.todayOnly);
  if (opts?.room) params.room = opts.room;
  const res = await instance.get('/dashboard/checkin/search', { params });


  return res.data;
};

export const getReservationForCheckIn = async (id: string) => {
  const res = await instance.get(`/dashboard/checkin/${id}`);
  return res.data;
};

export const confirmCheckIn = async (id: string, data: { selections: any[]; idVerifications?: any[] }) => {
  const res = await instance.post(`/dashboard/checkin/${id}/confirm`, data);
  return res.data;
};

// Staff Check-out APIs
export const listActiveStaysForCheckout = async () => {
  const res = await instance.get('/dashboard/checkout/inhouse');
  return res.data;
};

// Alias for listActiveStaysForCheckout
export const listInHouseStays = listActiveStaysForCheckout;

export const findStayByRoomNumberForCheckout = async (params?: { roomNumber?: string }) => {
  const res = await instance.get('/dashboard/checkout/find-room', { params });
  return res.data;
};

export const createCheckoutPayment = async (stayId: string, data?: any) => {
  const res = await instance.post(`/dashboard/checkout/${stayId}/create-payment`, data);
  return res.data;
};

export const verifyCheckoutPayment = async (stayId: string, data?: any) => {
  const res = await instance.post(`/dashboard/checkout/${stayId}/verify-payment`, data);
  return res.data;
};

export const confirmCheckout = async (stayId: string, data?: any) => {
  const res = await instance.post(`/dashboard/checkout/${stayId}/confirm`, data);
  return res.data;
};

// Additional functions from commit 57d0e0c
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

// Staff Check-in APIs from commit 57d0e0c
export const searchReservationsForCheckInOld = async (
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

export const getReservationForCheckInOld = async (
  id: string
): Promise<CheckinReservationDetail> => {
  const res = await instance.get(`/dashboard/checkin/${id}`);
  return res.data;
};

export const confirmCheckInOld = async (
  id: string,
  body?: ConfirmCheckinRequest
): Promise<ConfirmCheckinResponse> => {
  const res = await instance.post(`/dashboard/checkin/${id}/confirm`, body || {});
  return res.data;
};

export const findStayByRoomNumber = async (
  roomNumber: string
): Promise<CheckoutFindRoomResponse> => {
  const res = await instance.get('/dashboard/checkout/find-room', { params: { roomNumber } });
  return res.data;
};

export const createCheckoutPaymentOld = async (
  stayId: string,
  body?: CreateCheckoutPaymentBody
): Promise<CreateCheckoutPaymentResponse> => {
  const res = await instance.post(`/dashboard/checkout/${stayId}/create-payment`, body || {});
  return res.data;
};

export const verifyCheckoutPaymentOld = async (
  stayId: string
): Promise<VerifyCheckoutPaymentResponse> => {
  const res = await instance.post(`/dashboard/checkout/${stayId}/verify-payment`);
  return res.data;
};

export const confirmCheckoutOld = async (
  stayId: string,
  body?: ConfirmCheckoutBody
): Promise<ConfirmCheckoutResponse> => {
  const res = await instance.post(`/dashboard/checkout/${stayId}/confirm`, body || {});
  return res.data;
};

export const listInHouseStaysOld = async (
  query?: string
): Promise<ListInHouseResponse> => {
  const params: any = {};
  if (query && query.trim()) params.query = query.trim();
  const res = await instance.get('/dashboard/checkout/inhouse', { params });
  return res.data;
};
  