import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';

export type VoucherStatusFilter = 'all' | 'active' | 'inactive';
export type VoucherScopeFilter = 'all' | 'global' | 'multi-hotel';

type VoucherFiltersProps = {
  statusFilter: VoucherStatusFilter;
  scopeFilter: VoucherScopeFilter;
  onStatusChange: (value: VoucherStatusFilter) => void;
  onScopeChange: (value: VoucherScopeFilter) => void;
};

export function VoucherFilters({ 
  statusFilter, 
  scopeFilter, 
  onStatusChange, 
  onScopeChange 
}: VoucherFiltersProps) {
  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Trạng thái</InputLabel>
        <Select
          value={statusFilter}
          label="Trạng thái"
          onChange={(e) => onStatusChange(e.target.value as VoucherStatusFilter)}
        >
          <MenuItem value="all">Tất cả</MenuItem>
          <MenuItem value="active">Đang hoạt động</MenuItem>
          <MenuItem value="inactive">Không hoạt động</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Phạm vi</InputLabel>
        <Select
          value={scopeFilter}
          label="Phạm vi"
          onChange={(e) => onScopeChange(e.target.value as VoucherScopeFilter)}
        >
          <MenuItem value="all">Tất cả</MenuItem>
          <MenuItem value="global">Toàn hệ thống</MenuItem>
          <MenuItem value="multi-hotel">Nhiều khách sạn</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}

export default VoucherFilters;

