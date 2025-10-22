// src/redux/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

import roomReducer from './slices/roomSlice';
import roomTypeReducer from './slices/roomTypeSlice';


export const store = configureStore({
  reducer: {
    auth: authReducer,

    room: roomReducer,
    roomType: roomTypeReducer,

  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
