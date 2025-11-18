import type { ChangeEvent } from 'react';

import TextField from '@mui/material/TextField';

type PromotionSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function PromotionSearch({ value, onChange }: PromotionSearchProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <TextField
      fullWidth
      value={value}
      onChange={handleChange}
      label="Tìm theo tên hoặc mã khuyến mãi"
      placeholder="Nhập tên hoặc mã (vd: GIFT CARD, TCC-123456)"
      sx={{ maxWidth: 360 }}
    />
  );
}

export default PromotionSearch;

