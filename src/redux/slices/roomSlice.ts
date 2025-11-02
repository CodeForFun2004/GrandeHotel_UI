
// src/redux/slices/roomSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AxiosError } from 'axios';
import axios from '../../api/axios';

export type PopulatedRoomType = {
  _id: string;
  name: string;
  description?: string;
  capacity: number;
  basePrice: number;
  numberOfBeds: number;
  createdAt?: string;
  updatedAt?: string;
};

export type PopulatedHotel = {
  _id: string;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  description?: string;
  manager?: string;
  status?: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type Room = {
  _id?: string;
  roomType: PopulatedRoomType;
  hotel?: PopulatedHotel;
  roomNumber: string;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'reserving';
  description?: string;
  pricePerNight: number;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export interface CreateRoomPayload {
  roomType: string;  // ObjectId string
  hotel: string;     // ObjectId string
  roomNumber: string;
  status?: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'reserving';
  description?: string;
  pricePerNight: number;
  images?: string[];
}

export type UpdateRoomPayload = Partial<CreateRoomPayload>;

type RoomState = {
  rooms: Room[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
};

const initialState: RoomState = {
  rooms: [],
  loading: false,
  error: null,
  creating: false,
  updating: false,
  deleting: false,
};

// Async thunks
export const fetchRooms = createAsyncThunk<
  Room[],
  void,
  { rejectValue: string }
>(
  'room/fetchRooms',
  async (_, thunkAPI) => {
    try {
      const response = await axios.get('/rooms');
      // Backend returns { success: true, data: Room[], ... }
      // Extract the rooms array
      return response.data.success ? response.data.data : [];
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch rooms';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const createRoom = createAsyncThunk<
  Room,
  CreateRoomPayload,
  { rejectValue: string }
>(
  'room/createRoom',
  async (roomData, thunkAPI) => {
    try {
      const response = await axios.post('/rooms', roomData);
      // Backend returns { success: true, data: room, ... }
      return response.data.success ? response.data.data : null;
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      const msg = err?.response?.data?.message || err?.message || 'Failed to create room';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const updateRoom = createAsyncThunk<
  Room,
  { roomId: string; roomData: UpdateRoomPayload },
  { rejectValue: string }
>(
  'room/updateRoom',
  async ({ roomId, roomData }, thunkAPI) => {
    try {
      const response = await axios.put<Room>(`/rooms/${roomId}`, roomData);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      const msg = err?.response?.data?.message || err?.message || 'Failed to update room';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const deleteRoom = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'room/deleteRoom',
  async (roomId, thunkAPI) => {
    try {
      await axios.delete(`/rooms/${roomId}`);
      return roomId;
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete room';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch rooms
    builder
      .addCase(fetchRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRooms.fulfilled, (state, action: PayloadAction<Room[]>) => {
        state.loading = false;
        state.rooms = action.payload;
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to fetch rooms';
      })
      // Create room
      .addCase(createRoom.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createRoom.fulfilled, (state, action: PayloadAction<Room>) => {
        state.creating = false;
        state.rooms.push(action.payload);
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload ?? 'Failed to create room';
      })
      // Update room
      .addCase(updateRoom.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateRoom.fulfilled, (state, action: PayloadAction<Room>) => {
        state.updating = false;
        const index = state.rooms.findIndex(room => room._id === action.payload._id);
        if (index !== -1) {
          state.rooms[index] = action.payload;
        }
      })
      .addCase(updateRoom.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload ?? 'Failed to update room';
      })
      // Delete room
      .addCase(deleteRoom.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteRoom.fulfilled, (state, action: PayloadAction<string>) => {
        state.deleting = false;
        state.rooms = state.rooms.filter(room => room._id !== action.payload);
      })
      .addCase(deleteRoom.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload ?? 'Failed to delete room';
      });
  },
});

export const { clearError } = roomSlice.actions;
export default roomSlice.reducer;
