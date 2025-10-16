import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Chip, Button } from '@mui/material';
import { MeetingRoom, CheckCircle, Cancel, AccessTime } from '@mui/icons-material';

const StaffRooms = () => {
  const rooms = [
    { id: 1, number: '101', type: 'Standard', status: 'available', price: '$120/night' },
    { id: 2, number: '102', type: 'Deluxe', status: 'occupied', price: '$180/night' },
    { id: 3, number: '103', type: 'Standard', status: 'maintenance', price: '$120/night' },
    { id: 4, number: '201', type: 'Suite', status: 'available', price: '$250/night' },
    { id: 5, number: '202', type: 'Deluxe', status: 'occupied', price: '$180/night' },
    { id: 6, number: '203', type: 'Standard', status: 'available', price: '$120/night' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'occupied':
        return 'error';
      case 'maintenance':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle />;
      case 'occupied':
        return <Cancel />;
      case 'maintenance':
        return <AccessTime />;
      default:
        return <MeetingRoom />;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ color: '#b8192b', fontWeight: 'bold' }}>
          Room Management
        </Typography>
        <Button variant="contained" sx={{ backgroundColor: '#b8192b' }}>
          Add New Room
        </Button>
      </Box>

      <Grid container spacing={3}>
        {rooms.map((room) => (
          <Grid item xs={12} sm={6} md={4} key={room.id}>
            <Card sx={{ 
              height: '100%',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                boxShadow: '0 8px 12px rgba(0, 0, 0, 0.15)',
                transform: 'translateY(-2px)',
                transition: 'all 0.3s ease'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <MeetingRoom sx={{ mr: 1, color: '#b8192b' }} />
                  <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                    Room {room.number}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {room.type}
                </Typography>
                
                <Typography variant="h6" sx={{ mb: 2, color: '#b8192b' }}>
                  {room.price}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    icon={getStatusIcon(room.status)}
                    label={room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                    color={getStatusColor(room.status) as any}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default StaffRooms;
