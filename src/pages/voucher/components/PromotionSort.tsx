import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

export type PromotionSortOption = 'percent-desc' | 'percent-asc';

type PromotionSortProps = {
  value: PromotionSortOption;
  onChange: (value: PromotionSortOption) => void;
};

export function PromotionSort({ value, onChange }: PromotionSortProps) {
  return (
    <TextField
      select
      size="small"
      label="Sắp xếp"
      value={value}
      onChange={(event) => onChange(event.target.value as PromotionSortOption)}
      sx={{ minWidth: 180 }}
    >
      <MenuItem value="percent-desc">% Giảm dần</MenuItem>
      <MenuItem value="percent-asc">% Tăng dần</MenuItem>
    </TextField>
  );
}

export default PromotionSort;

