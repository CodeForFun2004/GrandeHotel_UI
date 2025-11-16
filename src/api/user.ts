import instance from './axios';

// Define user types based on backend models
export type User = {
  _id?: string;
  id?: string;
  username: string;
  fullname: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin' | 'staff' | 'shipper' | 'hotel-manager';
  avatar?: string;
  photoFace?: string;
  cccd?: string;
  cmnd?: string;
  passport?: string;
  address?: string;
  gender?: 'male' | 'female' | 'other';
  birthday?: string;
  country?: string;
  status?: string;
  storeId?: string;
  hotelId?: string;
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

export const uploadPhotoFace = async (id: string, formData: FormData) => {
  const res = await instance.put<User>(`/users/${id}/photoFace`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const uploadCitizenIdentification = async (id: string, payload: { type: 'cccd' | 'cmnd' | 'passport'; value: string }) => {
  const res = await instance.put(`/users/${id}/upload-citizen-id`, payload);
  return res.data;
};

export const checkCitizenIdentification = async (value: string) => {
  const res = await instance.post('/users/check-citizen-id', { value });
  return res.data;
};

export const getUsersWithPhotoFace = async () => {
  // Get all users and filter those with photoFace
  const res = await instance.get('/users');
  const users = Array.isArray(res.data) ? res.data : (res.data?.users || res.data?.data || []);
  // Filter users that have photoFace
  return users.filter((user: any) => user.photoFace);
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
  uploadPhotoFace,
  uploadCitizenIdentification,
  checkCitizenIdentification,
  getUsersWithPhotoFace,
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
