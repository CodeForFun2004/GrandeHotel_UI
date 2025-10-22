// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import hotelReducer from './slices/hotelSlice';
import roomReducer from './slices/roomSlice';
import serviceReducer from './slices/serviceSlice';
import reservationReducer from './slices/reservationSlice';
import contactReducer from './slices/contactSlice';
import dashboardReducer from './slices/dashboardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    hotels: hotelReducer,
    rooms: roomReducer,
    services: serviceReducer,
    reservations: reservationReducer,
    contacts: contactReducer,
    dashboard: dashboardReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
