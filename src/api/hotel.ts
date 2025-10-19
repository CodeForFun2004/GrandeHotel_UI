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
};
