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

export const searchReservationsForCheckIn = async (params?: { query?: string; checkInDate?: string; todayOnly?: boolean }) => {
  const res = await instance.get<CheckinSearchItem[]>('/dashboard/checkin/search', { params });
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
