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

export default {
  getDashboardStats,
  getRevenueData,
  getHotelPerformance,
  getBookingStatus,
  getUserStats,
};
