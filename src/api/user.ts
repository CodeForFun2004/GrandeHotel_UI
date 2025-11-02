import instance from './axios';

// Define user types based on backend models
export type User = {
  _id?: string;
  id?: string;
  username: string;
  fullname: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin' | 'staff' | 'shipper';
  avatar?: string;
  address?: string;
  gender?: 'male' | 'female' | 'other';
  birthday?: string;
  country?: string;
  status?: string;
  storeId?: string;
  googleId?: string;
  staffId?: string;
  isBanned?: boolean;
  banReason?: string;
  banExpires?: string;
  createdAt?: string;
  updatedAt?: string;
};

// User API functions
export const getAllUsers = async (params?: { page?: number; limit?: number }) => {
  const res = await instance.get('/users', { params });
  return res.data;
};

export const createUser = async (payload: Partial<User> & { password?: string }) => {
  const res = await instance.post<User>('/users', payload);
  return res.data;
};

export const getUserById = async (id: string) => {
  const res = await instance.get<User>(`/users/${id}`);
  return res.data;
};

export const updateUser = async (id: string, payload: Partial<User>) => {
  const res = await instance.put<User>(`/users/${id}`, payload);
  return res.data;
};

export const updateUserAvatar = async (id: string, formData: FormData) => {
  const res = await instance.put<User>(`/users/${id}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const deleteUser = async (id: string) => {
  const res = await instance.delete<{ message?: string }>(`/users/${id}`);
  return res.data;
};

export const suspendUser = async (id: string, payload: { isBanned: boolean; banReason?: string; banExpires?: string }) => {
  const res = await instance.put<User>(`/users/suspend/${id}`, payload);
  return res.data;
};

export const unsuspendUser = async (id: string) => {
  const res = await instance.put<User>(`/users/unsuspend/${id}`);
  return res.data;
};

export const filterUsersByRole = async (role: string) => {
  const res = await instance.get('/users/filter', { params: { role } });
  return res.data;
};

export const getCurrentUser = async () => {
  const res = await instance.get<User>('/users/me');
  return res.data;
};

export const getUserOrderHistory = async (userId?: string) => {
  const endpoint = userId ? `/users/${userId}/orders` : '/users/me/orders';
  const res = await instance.get(`/users/me/orders`);
  return res.data;
};

// Staff API functions (admin operations)
export const getAllStaff = async () => {
  const res = await instance.get('/staff');
  return res.data;
};

export const createStaff = async (payload: Partial<User> & { password?: string }) => {
  const res = await instance.post<User>('/staff', payload);
  return res.data;
};

export const getStaffById = async (id: string) => {
  const res = await instance.get<User>(`/staff/${id}`);
  return res.data;
};

export const updateStaff = async (id: string, payload: Partial<User>) => {
  const res = await instance.put<User>(`/staff/${id}`, payload);
  return res.data;
};

export const deleteStaff = async (id: string) => {
  const res = await instance.delete<{ message?: string }>(`/staff/${id}`);
  return res.data;
};

export default {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  updateUserAvatar,
  deleteUser,
  suspendUser,
  unsuspendUser,
  filterUsersByRole,
  getCurrentUser,
  getUserOrderHistory,
  getAllStaff,
  createStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
};
