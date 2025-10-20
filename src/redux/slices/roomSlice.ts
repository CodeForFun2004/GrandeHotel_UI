import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import * as roomApi from '../../api/room';
import type { RoomType, Room } from '../../types/entities';

type RoomState = {
  types: RoomType[];
  rooms: Room[];
  loading: boolean;
  error?: string | null;
};

const initialState: RoomState = { types: [], rooms: [], loading: false, error: null };

export const fetchRoomTypes = createAsyncThunk<RoomType[]>('rooms/fetchTypes', async () => {
  return roomApi.getAllRoomTypes();
});

export const fetchRooms = createAsyncThunk<Room[]>('rooms/fetchAll', async () => {
  return roomApi.getAllRooms();
});

const slice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoomTypes.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchRoomTypes.fulfilled, (s, a: PayloadAction<RoomType[]>) => { s.loading = false; s.types = a.payload; })
      .addCase(fetchRoomTypes.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Failed to load room types'; })

      .addCase(fetchRooms.pending, (s) => { s.loading = true; })
      .addCase(fetchRooms.fulfilled, (s, a: PayloadAction<Room[]>) => { s.loading = false; s.rooms = a.payload; })
      .addCase(fetchRooms.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Failed to load rooms'; });
  }
});

export default slice.reducer;
