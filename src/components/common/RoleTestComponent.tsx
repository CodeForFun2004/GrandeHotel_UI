import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { useNavigate } from 'react-router-dom';
import { Button, Box, Typography, Card, CardContent } from '@mui/material';
import { ADMIN_PATHS, MANAGER_PATHS, STAFF_PATHS } from '../../utils/constant/enum';

const RoleTestComponent = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Role-Based Navigation Test
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current User Info
          </Typography>
          <Typography variant="body1">
            <strong>Username:</strong> {user?.username || 'Not logged in'}
          </Typography>
          <Typography variant="body1">
            <strong>Email:</strong> {user?.email || 'N/A'}
          </Typography>
          <Typography variant="body1">
            <strong>Role:</strong> {user?.role || 'N/A'}
          </Typography>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6">Test Navigation (for development only):</Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => handleNavigate(ADMIN_PATHS.DASHBOARD)}
          >
            Admin Dashboard
          </Button>
          
          <Button 
            variant="contained" 
            color="secondary"
            onClick={() => handleNavigate(MANAGER_PATHS.DASHBOARD)}
          >
            Manager Dashboard
          </Button>
          
          <Button 
            variant="contained" 
            color="success"
            onClick={() => handleNavigate(STAFF_PATHS.DASHBOARD)}
          >
            Staff Dashboard
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="outlined"
            onClick={() => handleNavigate('/admin/user-management')}
          >
            Admin - User Management
          </Button>
          
          <Button 
            variant="outlined"
            onClick={() => handleNavigate('/manager/rooms')}
          >
            Manager - Rooms
          </Button>
          
          <Button 
            variant="outlined"
            onClick={() => handleNavigate('/staff/bookings')}
          >
            Staff - Bookings
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default RoleTestComponent;
