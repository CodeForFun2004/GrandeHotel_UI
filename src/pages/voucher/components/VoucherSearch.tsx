import type { ChangeEvent } from 'react';
import TextField from '@mui/material/TextField';

type VoucherSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function VoucherSearch({ value, onChange }: VoucherSearchProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <TextField
      fullWidth
      value={value}
      onChange={handleChange}
      label="Tìm theo mã, tên hoặc mô tả"
      placeholder="Nhập mã hoặc tên voucher..."
      sx={{ maxWidth: 360 }}
    />
  );
}

export default VoucherSearch;

