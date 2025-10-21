// src/redux/slices/roomTypeSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AxiosError } from 'axios';
import axios from '../../api/axios';

export interface CreateRoomTypePayload {
  name: string;
  description?: string;
  basePrice: number;
  capacity: number;
  numberOfBeds: number;
}

export interface UpdateRoomTypePayload extends Partial<CreateRoomTypePayload> {}

export type RoomType = {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  capacity: number;
  numberOfBeds: number;
};

type RoomTypeState = {
  roomTypes: RoomType[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
};

const initialState: RoomTypeState = {
  roomTypes: [],
  loading: false,
  error: null,
  creating: false,
  updating: false,
  deleting: false,
};

// Async thunks
export const fetchRoomTypes = createAsyncThunk<
  RoomType[],
  void,
  { rejectValue: string }
>(
  'roomType/fetchRoomTypes',
  async (_, thunkAPI) => {
    try {
      const response = await axios.get('/rooms/types');
      const data = response.data.map((item: any) => ({
        id: item._id,
        name: item.name,
        description: item.description,
        basePrice: item.basePrice,
        capacity: item.capacity,
        numberOfBeds: item.numberOfBeds,
      }));
      return data;
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch room types';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const createRoomType = createAsyncThunk<
  RoomType,
  CreateRoomTypePayload,
  { rejectValue: string }
>(
  'roomType/createRoomType',
  async (roomTypeData, thunkAPI) => {
    try {
      const response = await axios.post('/rooms/types', roomTypeData);
      const data = {
        id: response.data._id,
        name: response.data.name,
        description: response.data.description,
        basePrice: response.data.basePrice,
        capacity: response.data.capacity,
        numberOfBeds: response.data.numberOfBeds,
      };
      return data;
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      const msg = err?.response?.data?.message || err?.message || 'Failed to create room type';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const updateRoomType = createAsyncThunk<
  RoomType,
  { roomTypeId: string; roomTypeData: UpdateRoomTypePayload },
  { rejectValue: string }
>(
  'roomType/updateRoomType',
  async ({ roomTypeId, roomTypeData }, thunkAPI) => {
    try {
      const response = await axios.put(`/rooms/types/${roomTypeId}`, roomTypeData);
      const data = {
        id: response.data._id,
        name: response.data.name,
        description: response.data.description,
        basePrice: response.data.basePrice,
        capacity: response.data.capacity,
        numberOfBeds: response.data.numberOfBeds,
      };
      return data;
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      const msg = err?.response?.data?.message || err?.message || 'Failed to update room type';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

export const deleteRoomType = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'roomType/deleteRoomType',
  async (roomTypeId, thunkAPI) => {
    try {
      await axios.delete(`/rooms/types/${roomTypeId}`);
      return roomTypeId;
    } catch (error: unknown) {
      const err = error as AxiosError<{ message?: string }>;
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete room type';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

const roomTypeSlice = createSlice({
  name: 'roomType',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch room types
      .addCase(fetchRoomTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoomTypes.fulfilled, (state, action: PayloadAction<RoomType[]>) => {
        state.loading = false;
        state.roomTypes = action.payload;
      })
      .addCase(fetchRoomTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to fetch room types';
      })
      // Create room type
      .addCase(createRoomType.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createRoomType.fulfilled, (state, action: PayloadAction<RoomType>) => {
        state.creating = false;
        state.roomTypes.push(action.payload);
      })
      .addCase(createRoomType.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload ?? 'Failed to create room type';
      })
      // Update room type
      .addCase(updateRoomType.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateRoomType.fulfilled, (state, action: PayloadAction<RoomType>) => {
        state.updating = false;
        const index = state.roomTypes.findIndex(rt => rt.id === action.payload.id);
        if (index !== -1) {
          state.roomTypes[index] = action.payload;
        }
      })
      .addCase(updateRoomType.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload ?? 'Failed to update room type';
      })
      // Delete room type
      .addCase(deleteRoomType.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteRoomType.fulfilled, (state, action: PayloadAction<string>) => {
        state.deleting = false;
        state.roomTypes = state.roomTypes.filter(rt => rt.id !== action.payload);
      })
      .addCase(deleteRoomType.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload ?? 'Failed to delete room type';
      });
  },
});

export const { clearError } = roomTypeSlice.actions;
export default roomTypeSlice.reducer;
