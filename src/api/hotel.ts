import instance from './axios';
import type { Hotel, Service } from '../types/entities';

// Hotel API
export const getAllHotels = async (params?: { page?: number; limit?: number }) => {
  const res = await instance.get('/hotels', { params });
  return res.data as { results: Hotel[]; total: number; page: number; limit: number };
};

export const getHotelById = async (id: string) => {
  const res = await instance.get<Hotel>(`/hotels/${id}`);
  return res.data;
};

export const createHotel = async (payload: Partial<Hotel>) => {
  const res = await instance.post<Hotel>('/hotels', payload);
  return res.data;
};

export const updateHotel = async (id: string, payload: Partial<Hotel>) => {
  const res = await instance.put<Hotel>(`/hotels/${id}`, payload);
  return res.data;
};

export const deleteHotel = async (id: string) => {
  const res = await instance.delete<{ message?: string }>(`/hotels/${id}`);
  return res.data;
};

export const searchHotelsByLocation = async (params: { city: string; checkInDate?: string; checkOutDate?: string; page?: number; limit?: number }) => {
  const res = await instance.get('/hotels/search', { params });
  return res.data as { results: Array<any>; total: number; page: number; limit: number };
};

// Service endpoints scoped under hotel
export const getHotelServices = async (hotelId: string) => {
  const res = await instance.get<Service[]>(`/hotels/${hotelId}/services`);
  return res.data;
};

export const createService = async (hotelId: string, payload: Partial<Service>) => {
  const res = await instance.post<Service>('/services', { hotel: hotelId, ...payload });
  return res.data;
};

export const getServiceById = async (id: string) => {
  const res = await instance.get<Service>(`/services/${id}`);
  return res.data;
};

export const updateService = async (id: string, payload: Partial<Service>) => {
  const res = await instance.put<Service>(`/services/${id}`, payload);
  return res.data;
};

export const deleteService = async (id: string) => {
  const res = await instance.delete<{ message?: string }>(`/services/${id}`);
  return res.data;
};

// Admin Hotel Management APIs
export const getAllAdminHotels = async (params?: { page?: number; limit?: number }) => {
  const res = await instance.get('/admin/hotels', { params });
  return res.data;
};

export const getAdminHotelById = async (id: string) => {
  const res = await instance.get<Hotel>(`/admin/hotels/${id}`);
  return res.data;
};

export const createAdminHotel = async (payload: Partial<Hotel>, images?: File[]) => {
  const formData = new FormData();

  // Add hotel data
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value.toString());
    }
  });

  // Add images
  if (images && images.length > 0) {
    images.forEach((image, index) => {
      formData.append('images', image);
    });
  }

  const res = await instance.post<Hotel>('/admin/hotels', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const updateAdminHotel = async (id: string, payload: Partial<Hotel>, images?: File[]) => {
  const formData = new FormData();

  // Add hotel data
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value.toString());
    }
  });

  // Add images
  if (images && images.length > 0) {
    images.forEach((image, index) => {
      formData.append('images', image);
    });
  }

  const res = await instance.put<Hotel>(`/admin/hotels/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const deleteAdminHotel = async (id: string) => {
  const res = await instance.delete<{ message?: string }>(`/admin/hotels/${id}`);
  return res.data;
};

export const assignManagerToHotel = async (hotelId: string, managerId: string) => {
  const res = await instance.put(`/admin/hotels/${hotelId}/assign-manager`, { managerId });
  return res.data;
};

export const unassignManagerFromHotel = async (hotelId: string) => {
  const res = await instance.put(`/admin/hotels/${hotelId}/unassign-manager`);
  return res.data;
};

export const getAvailableManagers = async () => {
  const res = await instance.get('/admin/hotels/managers/available');
  return res.data;
};

export default {
  getAllHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
  searchHotelsByLocation,
  getHotelServices,
  createService,
  getServiceById,
  updateService,
  deleteService,
  // Admin APIs
  getAllAdminHotels,
  getAdminHotelById,
  createAdminHotel,
  updateAdminHotel,
  deleteAdminHotel,
  assignManagerToHotel,
  unassignManagerFromHotel,
  getAvailableManagers,
};
