import instance from './axios';

export type CreateReservationPayload = {
  hotelId: string;
  customerId: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  rooms: Array<{ roomTypeId: string; quantity: number }>;
  voucherCode?: string;
};

export const createReservation = async (payload: CreateReservationPayload) => {
  const res = await instance.post('/reservations', payload);
  return res.data;
};

export const getAllReservations = async () => {
  const res = await instance.get('/reservations');
  return res.data;
};

export const getReservationById = async (id: string) => {
  const res = await instance.get(`/reservations/${id}`);
  return res.data;
};

export const updateReservationStatus = async (id: string, status: string) => {
  const res = await instance.put(`/reservations/${id}/status`, { status });
  return res.data;
};

export const deleteReservation = async (id: string) => {
  const res = await instance.delete(`/reservations/${id}`);
  return res.data;
};

export default {
  createReservation,
  getAllReservations,
  getReservationById,
  updateReservationStatus,
  deleteReservation,
};
