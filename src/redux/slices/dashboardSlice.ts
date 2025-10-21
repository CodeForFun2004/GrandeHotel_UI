import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import * as dashboardApi from '../../api/dashboard';
import type { RevenueData, HotelPerformance, BookingStatus, UserStats, StatsSummary } from '../../api/dashboard';

type DashboardState = {
  stats: StatsSummary;
  revenueData: RevenueData[];
  hotelPerformance: HotelPerformance[];
  bookingStatus: BookingStatus[];
  userStats: UserStats[];
  loading: boolean;
  error?: string | null;
};

const initialState: DashboardState = {
  stats: {
    totalHotels: 0,
    totalRooms: 0,
    totalUsers: 0,
    totalRevenue: 0,
  },
  revenueData: [],
  hotelPerformance: [],
  bookingStatus: [],
  userStats: [],
  loading: false,
  error: null,
};

export const fetchDashboardStats = createAsyncThunk<StatsSummary>('dashboard/fetchStats', async () => {
  return dashboardApi.getDashboardStats();
});

export const fetchRevenueData = createAsyncThunk<RevenueData[]>('dashboard/fetchRevenue', async () => {
  return dashboardApi.getRevenueData();
});

export const fetchHotelPerformance = createAsyncThunk<HotelPerformance[]>('dashboard/fetchHotelPerformance', async () => {
  return dashboardApi.getHotelPerformance();
});

export const fetchBookingStatus = createAsyncThunk<BookingStatus[]>('dashboard/fetchBookingStatus', async () => {
  return dashboardApi.getBookingStatus();
});

export const fetchUserStats = createAsyncThunk<UserStats[]>('dashboard/fetchUserStats', async () => {
  return dashboardApi.getUserStats();
});

const slice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchDashboardStats.fulfilled, (s, a: PayloadAction<StatsSummary>) => {
        s.loading = false;
        s.stats = a.payload;
      })
      .addCase(fetchDashboardStats.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message ?? 'Failed to load dashboard stats';
      })

      .addCase(fetchRevenueData.pending, (s) => { s.loading = true; })
      .addCase(fetchRevenueData.fulfilled, (s, a: PayloadAction<RevenueData[]>) => {
        s.loading = false;
        s.revenueData = a.payload;
      })
      .addCase(fetchRevenueData.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message ?? 'Failed to load revenue data';
      })

      .addCase(fetchHotelPerformance.pending, (s) => { s.loading = true; })
      .addCase(fetchHotelPerformance.fulfilled, (s, a: PayloadAction<HotelPerformance[]>) => {
        s.loading = false;
        s.hotelPerformance = a.payload;
      })
      .addCase(fetchHotelPerformance.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message ?? 'Failed to load hotel performance data';
      })

      .addCase(fetchBookingStatus.pending, (s) => { s.loading = true; })
      .addCase(fetchBookingStatus.fulfilled, (s, a: PayloadAction<BookingStatus[]>) => {
        s.loading = false;
        s.bookingStatus = a.payload;
      })
      .addCase(fetchBookingStatus.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message ?? 'Failed to load booking status data';
      })

      .addCase(fetchUserStats.pending, (s) => { s.loading = true; })
      .addCase(fetchUserStats.fulfilled, (s, a: PayloadAction<UserStats[]>) => {
        s.loading = false;
        s.userStats = a.payload;
      })
      .addCase(fetchUserStats.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message ?? 'Failed to load user stats data';
      });
  }
});

export default slice.reducer;
