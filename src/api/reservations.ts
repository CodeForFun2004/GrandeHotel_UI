import instance from './axios';

export const cancelReservation = async (
  id: string,
  reason: string
): Promise<{ message: string }> => {
  const res = await instance.put(`/reservations/${id}/approve`, {
    action: 'cancel',
    reason,
  });
  return res.data;
};

export default { cancelReservation };
