import instance from './axios';

export type CreateReservationPayload = {
  hotelId: string;
  // customerId is derived from auth on backend; keep optional for backward compat
  customerId?: string;
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

// Approve or cancel (reject) reservation
export const approveReservation = async (
  id: string,
  action: 'approve' | 'cancel',
  reason?: string
) => {
  const res = await instance.put(`/reservations/${id}/approve`, { action, reason });
  return res.data;
};

// Select payment option: 'full' | 'deposit'
export const selectPaymentOption = async (
  id: string,
  paymentType: 'full' | 'deposit'
) => {
  const res = await instance.post(`/reservations/${id}/payment-options`, { paymentType });
  return res.data;
};

// Verify payment via AppScript (server will match and update Payment)
export const verifyReservationPayment = async (id: string) => {
  const res = await instance.put(`/reservations/${id}/payment`);
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
  approveReservation,
  selectPaymentOption,
  verifyReservationPayment,
  deleteReservation,
};
