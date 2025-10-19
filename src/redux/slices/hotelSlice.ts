import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import * as hotelApi from '../../api/hotel';
import type { Hotel } from '../../types/entities';

type HotelState = {
  items: Hotel[];
  current?: Hotel | null;
  loading: boolean;
  error?: string | null;
};

const initialState: HotelState = { items: [], current: null, loading: false, error: null };

export const fetchHotels = createAsyncThunk<Hotel[]>('hotels/fetchAll', async () => {
  const res = await hotelApi.getAllHotels();
  return res.results;
});

export const fetchHotelById = createAsyncThunk<Hotel, string>('hotels/fetchById', async (id) => {
  return hotelApi.getHotelById(id);
});

const slice = createSlice({
  name: 'hotels',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotels.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchHotels.fulfilled, (s, a: PayloadAction<Hotel[]>) => { s.loading = false; s.items = a.payload; })
      .addCase(fetchHotels.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Failed to load hotels'; })

      .addCase(fetchHotelById.pending, (s) => { s.loading = true; })
      .addCase(fetchHotelById.fulfilled, (s, a: PayloadAction<Hotel>) => { s.loading = false; s.current = a.payload; })
      .addCase(fetchHotelById.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Failed to load hotel'; });
  }
});

export default slice.reducer;
