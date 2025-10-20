import instance from './axios';
import type { RoomType, Room } from '../types/entities';

// RoomType endpoints
export const getAllRoomTypes = async () => {
  const res = await instance.get<RoomType[]>('/room-types');
  return res.data;
};

export const getRoomTypeById = async (id: string) => {
  const res = await instance.get<RoomType>(`/room-types/${id}`);
  return res.data;
};

export const createRoomType = async (payload: Partial<RoomType>) => {
  const res = await instance.post<RoomType>('/room-types', payload);
  return res.data;
};

export const updateRoomType = async (id: string, payload: Partial<RoomType>) => {
  const res = await instance.put<RoomType>(`/room-types/${id}`, payload);
  return res.data;
};

export const deleteRoomType = async (id: string) => {
  const res = await instance.delete<{ message?: string }>(`/room-types/${id}`);
  return res.data;
};

// Room endpoints
export const getAllRooms = async () => {
  const res = await instance.get<Room[]>('/rooms');
  return res.data;
};

export const getRoomById = async (id: string) => {
  const res = await instance.get<Room>(`/rooms/${id}`);
  return res.data;
};

export const createRoom = async (payload: Partial<Room>) => {
  const res = await instance.post<Room>('/rooms', payload);
  return res.data;
};

export const updateRoom = async (id: string, payload: Partial<Room>) => {
  const res = await instance.put<Room>(`/rooms/${id}`, payload);
  return res.data;
};

export const deleteRoom = async (id: string) => {
  const res = await instance.delete<{ message?: string }>(`/rooms/${id}`);
  return res.data;
};

// Search rooms for a hotel (already exposed as GET /hotels/:hotelId/rooms)
export const searchHotelRooms = async (hotelId: string, params: { checkInDate?: string; checkOutDate?: string; numberOfRooms?: number; page?: number; limit?: number }) => {
  const res = await instance.get(`/hotels/${hotelId}/rooms`, { params });
  return res.data as { results: any[]; total: number; page: number; limit: number };
};

export default {
  // room types
  getAllRoomTypes,
  getRoomTypeById,
  createRoomType,
  updateRoomType,
  deleteRoomType,
  // rooms
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  // search
  searchHotelRooms,
};
