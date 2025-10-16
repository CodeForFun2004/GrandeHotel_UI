import React from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActions, Button } from '@mui/material';
import { BarChart, TrendingUp, People, MeetingRoom } from '@mui/icons-material';

const StaffDashboard = () => {
  const stats = [
    {
      title: 'Total Bookings',
      value: '156',
      icon: <BarChart />,
      color: '#1976d2'
    },
    {
      title: 'Available Rooms',
      value: '24',
      icon: <MeetingRoom />,
      color: '#388e3c'
    },
    {
      title: 'Today\'s Check-ins',
      value: '12',
      icon: <TrendingUp />,
      color: '#f57c00'
    },
    {
      title: 'Active Customers',
      value: '89',
      icon: <People />,
      color: '#7b1fa2'
    }
  ];

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#b8192b', fontWeight: 'bold' }}>
        Staff Dashboard
      </Typography>
      
      <Typography variant="subtitle1" sx={{ mb: 4, color: 'text.secondary' }}>
        Welcome to your staff dashboard. Here you can manage rooms, bookings, and customer interactions.
      </Typography>

      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                boxShadow: '0 8px 12px rgba(0, 0, 0, 0.15)',
                transform: 'translateY(-2px)',
                transition: 'all 0.3s ease'
              }
            }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: '50%', 
                    backgroundColor: `${stat.color}20`,
                    color: stat.color,
                    mr: 2
                  }}>
                    {stat.icon}
                  </Box>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                    {stat.value}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {stat.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '300px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Bookings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage and view recent hotel bookings
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" variant="contained" sx={{ backgroundColor: '#b8192b' }}>
                View All Bookings
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '300px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Room Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Check room status and availability
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" variant="contained" sx={{ backgroundColor: '#b8192b' }}>
                Manage Rooms
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StaffDashboard;
