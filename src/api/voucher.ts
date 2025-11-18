import instance from './axios';
import type { Voucher } from '../types/entities';

// Voucher API endpoints
export const getAllVouchers = async (params?: { 
  page?: number; 
  limit?: number; 
  status?: 'active' | 'inactive';
  scope?: 'global' | 'multi-hotel';
}) => {
  const res = await instance.get('/vouchers', { params });
  const data = res.data;
  // Handle different response formats from backend
  if (Array.isArray(data)) {
    return { results: data, total: data.length, page: 1, limit: data.length };
  }
  if (data.results && Array.isArray(data.results)) {
    return data as { results: Voucher[]; total: number; page: number; limit: number };
  }
  if (data.data && Array.isArray(data.data)) {
    return { results: data.data, total: data.total || data.data.length, page: data.page || 1, limit: data.limit || data.data.length };
  }
  // Default fallback
  return { results: [], total: 0, page: 1, limit: 0 };
};

export const getVoucherById = async (id: string) => {
  const res = await instance.get<Voucher>(`/vouchers/${id}`);
  return res.data;
};

export const getVoucherByCode = async (code: string) => {
  const res = await instance.get<Voucher>(`/vouchers/code/${code}`);
  return res.data;
};

export const createVoucher = async (payload: Partial<Voucher>) => {
  const res = await instance.post<Voucher>('/vouchers', payload);
  return res.data;
};

export const updateVoucher = async (id: string, payload: Partial<Voucher>) => {
  const res = await instance.put<Voucher>(`/vouchers/${id}`, payload);
  return res.data;
};

export const deleteVoucher = async (id: string) => {
  const res = await instance.delete<{ message?: string }>(`/vouchers/${id}`);
  return res.data;
};

// Lock/Unlock voucher - backend uses PATCH /:id/lock to toggle
// Note: If CORS doesn't allow PATCH, try PUT as fallback
export const toggleLockVoucher = async (id: string) => {
  try {
    // Try PATCH first (preferred method)
    const res = await instance.patch<Voucher>(`/vouchers/${id}/lock`);
    return res.data;
  } catch (error: any) {
    // If PATCH fails due to CORS, try PUT as fallback
    if (error?.code === 'ERR_NETWORK' || error?.message?.includes('CORS')) {
      console.warn('PATCH method blocked by CORS, trying PUT as fallback...');
      try {
        const res = await instance.put<Voucher>(`/vouchers/${id}/lock`);
        return res.data;
      } catch (putError) {
        // If PUT also fails, throw original error
        throw error;
      }
    }
    throw error;
  }
};

// Alias for backward compatibility
export const lockVoucher = toggleLockVoucher;
export const unlockVoucher = toggleLockVoucher;

// Validate voucher code
export const validateVoucher = async (code: string, params?: {
  bookingValue?: number;
  userId?: string;
}) => {
  const res = await instance.post<{
    valid: boolean;
    voucher?: Voucher;
    message?: string;
    discountAmount?: number;
  }>(`/vouchers/validate/${code}`, params);
  return res.data;
};

export default {
  getAllVouchers,
  getVoucherById,
  getVoucherByCode,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  lockVoucher,
  unlockVoucher,
  validateVoucher,
};

