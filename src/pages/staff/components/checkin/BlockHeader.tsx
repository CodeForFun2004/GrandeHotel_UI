import { Stack, Avatar, Box, Typography } from "@mui/material";
import React from "react";

export function BlockHeader({ 
  icon, 
  title, 
  subtitle 
}: { 
  icon: React.ReactNode; 
  title: string; 
  subtitle?: string;
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
      <Avatar sx={{ width: 28, height: 28 }}>{icon}</Avatar>
      <Box>
        <Typography variant="h6">{title}</Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

