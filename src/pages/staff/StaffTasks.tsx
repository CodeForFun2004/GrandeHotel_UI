import React from "react";
import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { useLocation } from "react-router-dom";

const StaffTasks: React.FC = () => {
  const location = useLocation();
  const focusTask = (location.state as { focusTask?: string } | undefined)?.focusTask;

  return (
    <Box>
      <Typography variant="h5" fontWeight={900} sx={{ color: "#b8192b", mb: 2 }}>
        Tasks
      </Typography>
      <Card>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body1">Trang Task (UI placeholder).</Typography>
            {focusTask && <Chip color="primary" size="small" label={`Focus: ${focusTask}`} />}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Tính năng chi tiết Task sẽ được bổ sung sau. Nút từ Calendar đã điều hướng tới đây.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default StaffTasks;
