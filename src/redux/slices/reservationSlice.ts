import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import * as reservationApi from '../../api/reservation';
import type { Reservation } from '../../types/entities';

type ReservationState = {
  items: Reservation[];
  current?: Reservation | null;
  loading: boolean;
  error?: string | null;
};

const initialState: ReservationState = { items: [], current: null, loading: false, error: null };

export const createReservation = createAsyncThunk<any, any>('reservations/create', async (payload) => {
  return reservationApi.createReservation(payload);
});

export const fetchReservations = createAsyncThunk<any>('reservations/fetchAll', async () => {
  return reservationApi.getAllReservations();
});

export const fetchReservationById = createAsyncThunk<any, string>('reservations/fetchById', async (id) => {
  return reservationApi.getReservationById(id);
});

const slice = createSlice({
  name: 'reservations',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createReservation.pending, (s) => { s.loading = true; s.error = null; })
  .addCase(createReservation.fulfilled, (s, _a) => { s.loading = false; /* API returns message + reservation */ })
      .addCase(createReservation.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Failed to create reservation'; })

      .addCase(fetchReservations.pending, (s) => { s.loading = true; })
      .addCase(fetchReservations.fulfilled, (s, a: PayloadAction<any>) => { s.loading = false; s.items = a.payload.reservations ?? a.payload; })
      .addCase(fetchReservations.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Failed to fetch reservations'; })

      .addCase(fetchReservationById.pending, (s) => { s.loading = true; })
      .addCase(fetchReservationById.fulfilled, (s, a: PayloadAction<any>) => { s.loading = false; s.current = a.payload.reservation ?? a.payload; })
      .addCase(fetchReservationById.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Failed to fetch reservation'; });
  }
});

export default slice.reducer;
