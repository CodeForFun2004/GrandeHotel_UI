import { toast } from 'sonner';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { useAppDispatch } from '../../../redux/hooks';
import { addPromotion } from 'src/store/slices/promotionSlice';

import type { IPromotionItem } from './promotion-item';

type AddPromoModalProps = {
  open: boolean;
  onClose: () => void;
};

type FormState = {
  title: string;
  description: string;
  discountPercent: string;
  expiryDate: string;
  minOrder: string;
  requiredPoints: string;
};

const defaultForm: FormState = {
  title: '',
  description: '',
  discountPercent: '',
  expiryDate: '',
  minOrder: '',
  requiredPoints: '',
};

const generatePromotionCode = () => {
  const random6Digits = Math.floor(100000 + Math.random() * 900000);
  return `TCC-${random6Digits}`;
};

const isPositiveNumber = (value: string, allowEmpty = false) => {
  if (allowEmpty && value.trim() === '') return true;
  const parsed = Number(value);
  return !Number.isNaN(parsed) && parsed >= 0;
};

export function AddPromoModal({ open, onClose }: AddPromoModalProps) {
  const dispatch = useAppDispatch();

  const [form, setForm] = useState<FormState>(defaultForm);
  const [promotionCode, setPromotionCode] = useState(() => generatePromotionCode());
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(defaultForm);
      setPromotionCode(generatePromotionCode());
      setErrorMessage(null);
      setSubmitting(false);
    }
  }, [open]);

  const handleChange = useCallback(
    (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    },
    []
  );

  const parsedValues = useMemo(() => {
    const discountPercent = Number(form.discountPercent);
    const minOrder = form.minOrder.trim() === '' ? 0 : Number(form.minOrder);
    const requiredPoints = form.requiredPoints.trim() === '' ? 0 : Number(form.requiredPoints);

    return { discountPercent, minOrder, requiredPoints };
  }, [form.discountPercent, form.minOrder, form.requiredPoints]);

  const validateForm = useCallback(() => {
    if (!form.title.trim()) {
      setErrorMessage('Vui lòng nhập tên khuyến mãi.');
      return false;
    }
    if (!form.discountPercent.trim() || !isPositiveNumber(form.discountPercent)) {
      setErrorMessage('Vui lòng nhập % giảm giá hợp lệ.');
      return false;
    }
    if (parsedValues.discountPercent > 100) {
      setErrorMessage('% giảm giá không được vượt quá 100%.');
      return false;
    }
    if (!form.expiryDate.trim()) {
      setErrorMessage('Vui lòng chọn ngày hết hạn.');
      return false;
    }
    if (!isPositiveNumber(form.minOrder, true)) {
      setErrorMessage('Giá trị đơn tối thiểu phải là số không âm.');
      return false;
    }
    if (!isPositiveNumber(form.requiredPoints, true)) {
      setErrorMessage('Điểm quy đổi phải là số không âm.');
      return false;
    }
    return true;
  }, [
    form.title,
    form.discountPercent,
    form.expiryDate,
    form.minOrder,
    form.requiredPoints,
    parsedValues.discountPercent,
  ]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setErrorMessage(null);

      if (!validateForm()) return;

      setSubmitting(true);

      const payload: IPromotionItem = {
        _id: promotionCode,
        title: form.title.trim(),
        description: form.description.trim(),
        discountPercent: parsedValues.discountPercent,
        expiryDate: new Date(form.expiryDate).toISOString(),
        minOrder: parsedValues.minOrder,
        image: '',
        promotionCode,
        requiredPoints: parsedValues.requiredPoints,
        isLock: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch(addPromotion(payload));
      toast.success('Tạo khuyến mãi thành công!', { description: payload.promotionCode });

      setSubmitting(false);
      onClose();
    },
    [
      form.title,
      form.description,
      form.expiryDate,
      parsedValues.discountPercent,
      parsedValues.minOrder,
      parsedValues.requiredPoints,
      promotionCode,
      dispatch,
      onClose,
      validateForm,
    ]
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Tạo mã khuyến mãi</DialogTitle>
      <DialogContent>
        <Stack component="form" spacing={2.5} sx={{ mt: 1.5 }} onSubmit={handleSubmit}>
          <TextField
            label="Tên khuyến mãi"
            value={form.title}
            onChange={handleChange('title')}
            required
            fullWidth
          />

          <TextField
            label="Mô tả"
            value={form.description}
            onChange={handleChange('description')}
            multiline
            minRows={3}
            fullWidth
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="% giảm giá"
              type="number"
              value={form.discountPercent}
              onChange={handleChange('discountPercent')}
              required
              fullWidth
              inputProps={{ min: 0, max: 100 }}
            />

            <TextField
              label="Điểm quy đổi (tùy chọn)"
              type="number"
              value={form.requiredPoints}
              onChange={handleChange('requiredPoints')}
              fullWidth
              inputProps={{ min: 0 }}
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Ngày hết hạn"
              type="date"
              value={form.expiryDate}
              onChange={handleChange('expiryDate')}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Giá trị đơn tối thiểu (₫)"
              type="number"
              value={form.minOrder}
              onChange={handleChange('minOrder')}
              fullWidth
              inputProps={{ min: 0, step: 1000 }}
            />
          </Stack>

          <TextField
            label="Mã khuyến mãi"
            value={promotionCode}
            InputProps={{ readOnly: true }}
            fullWidth
          />

          {errorMessage && (
            <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
              {errorMessage}
            </Typography>
          )}

          <DialogActions sx={{ px: 0 }}>
            <Button type="button" color="inherit" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              Tạo mới
            </Button>
          </DialogActions>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

export default AddPromoModal;
