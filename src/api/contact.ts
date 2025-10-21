import instance from './axios';
import type { Contact } from '../types/entities';

// Contact API
export const getAllContacts = async (params?: { page?: number; limit?: number }) => {
  const res = await instance.get('/contacts', { params });
  return res.data as { results: Contact[]; total: number; page: number; limit: number };
};

export const getContactById = async (id: string) => {
  const res = await instance.get<Contact>(`/contacts/${id}`);
  return res.data;
};

export const createContact = async (payload: Partial<Contact>) => {
  const res = await instance.post<Contact>('/contacts', payload);
  return res.data;
};

export const updateContact = async (id: string, payload: Partial<Contact>) => {
  const res = await instance.put<Contact>(`/contacts/${id}`, payload);
  return res.data;
};

export const deleteContact = async (id: string) => {
  const res = await instance.delete<{ message?: string }>(`/contacts/${id}`);
  return res.data;
};

export default {
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
};
