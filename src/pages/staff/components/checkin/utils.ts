import type { IdType } from "./constants";

export const formatVND = (n: number) =>
  (Number.isFinite(n) ? n : 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

export const validateIdDoc = (doc?: { type?: IdType; number?: string; nameOnId?: string }) => {
  if (!doc) return false;
  const t = doc.type || 'cccd';
  const num = (doc.number || '').trim();
  const name = (doc.nameOnId || '').trim();
  if (name.length < 2) return false;
  if (t === 'cccd') return /^\d{12}$/.test(num);
  if (t === 'cmnd') return /^\d{9}$/.test(num);
  if (t === 'passport') return /^[A-Z0-9]{6,9}$/.test(num);
  return /^[A-Z0-9-]{6,20}$/.test(num);
};

export const sanitizeIdNumber = (type: IdType, value: string): string => {
  if (type === 'cccd' || type === 'cmnd') {
    return value.replace(/\D/g, '');
  }
  return value.toUpperCase();
};

