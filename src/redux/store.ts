// src/redux/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import contactReducer from './slices/contactSlice';
import roomReducer from './slices/roomSlice';
import roomTypeReducer from './slices/roomTypeSlice';
import hotelReducer from './slices/hotelSlice';
import serviceReducer from './slices/serviceSlice';
import reservationReducer from './slices/reservationSlice';
import dashboardReducer from './slices/dashboardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    hotels: hotelReducer,
    contacts: contactReducer,
    room: roomReducer,
    roomType: roomTypeReducer,
    services: serviceReducer,
    reservations: reservationReducer,
    dashboard: dashboardReducer,

  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
