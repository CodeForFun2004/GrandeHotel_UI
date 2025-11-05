import { Stack, Typography } from "@mui/material";
import React from "react";

export function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={600} textAlign="right" sx={{ ml: 2 }}>
        {value}
      </Typography>
    </Stack>
  );
}

