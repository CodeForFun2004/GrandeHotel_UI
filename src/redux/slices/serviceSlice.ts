import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import * as hotelApi from '../../api/hotel';
import type { Service } from '../../types/entities';

type ServiceState = {
  items: Service[];
  loading: boolean;
  error?: string | null;
};

const initialState: ServiceState = { items: [], loading: false, error: null };

export const fetchServicesForHotel = createAsyncThunk<Service[], string>('services/fetchForHotel', async (hotelId) => {
  return hotelApi.getHotelServices(hotelId);
});

const slice = createSlice({
  name: 'services',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchServicesForHotel.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchServicesForHotel.fulfilled, (s, a: PayloadAction<Service[]>) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchServicesForHotel.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Failed to load services'; });
  }
});

export default slice.reducer;
