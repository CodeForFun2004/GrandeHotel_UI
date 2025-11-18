import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

export type PromotionLockFilter = 'all' | 'locked' | 'unlocked';

type PromotionFiltersProps = {
  value: PromotionLockFilter;
  onChange: (value: PromotionLockFilter) => void;
};

export function PromotionFilters({ value, onChange }: PromotionFiltersProps) {
  const handleChange = (_event: React.MouseEvent<HTMLElement>, newValue: PromotionLockFilter | null) => {
    if (newValue) {
      onChange(newValue);
    }
  };

  return (
    <ToggleButtonGroup
      exclusive
      value={value}
      onChange={handleChange}
      size="small"
      color="primary"
      sx={{ flexWrap: 'wrap' }}
    >
      <ToggleButton value="all">Tất cả</ToggleButton>
      <ToggleButton value="unlocked">Đang mở</ToggleButton>
      <ToggleButton value="locked">Đã khóa</ToggleButton>
    </ToggleButtonGroup>
  );
}

export default PromotionFilters;

