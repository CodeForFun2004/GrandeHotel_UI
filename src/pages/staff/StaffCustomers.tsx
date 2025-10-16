import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Avatar, Chip, Button, TextField, InputAdornment } from '@mui/material';
import { Search, Person, Email, Phone, LocationOn } from '@mui/icons-material';

const StaffCustomers = () => {
  const customers = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@email.com',
      phone: '+1 234-567-8900',
      location: 'New York, NY',
      status: 'active',
      totalBookings: 5,
      avatar: '/api/placeholder/40/40'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@email.com',
      phone: '+1 234-567-8901',
      location: 'Los Angeles, CA',
      status: 'active',
      totalBookings: 3,
      avatar: '/api/placeholder/40/40'
    },
    {
      id: 3,
      name: 'Bob Johnson',
      email: 'bob.johnson@email.com',
      phone: '+1 234-567-8902',
      location: 'Chicago, IL',
      status: 'inactive',
      totalBookings: 1,
      avatar: '/api/placeholder/40/40'
    },
    {
      id: 4,
      name: 'Alice Brown',
      email: 'alice.brown@email.com',
      phone: '+1 234-567-8903',
      location: 'Miami, FL',
      status: 'active',
      totalBookings: 7,
      avatar: '/api/placeholder/40/40'
    }
  ];

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'default';
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ color: '#b8192b', fontWeight: 'bold' }}>
          Customer Management
        </Typography>
        <Button variant="contained" sx={{ backgroundColor: '#b8192b' }}>
          Add Customer
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder="Search customers..."
          variant="outlined"
          size="small"
          sx={{ width: '300px' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Grid container spacing={3}>
        {customers.map((customer) => (
          <Grid item xs={12} sm={6} md={4} key={customer.id}>
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
                  <Avatar sx={{ mr: 2, bgcolor: '#b8192b' }}>
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                      {customer.name}
                    </Typography>
                    <Chip
                      label={customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                      color={getStatusColor(customer.status) as any}
                      size="small"
                    />
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Email sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {customer.email}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Phone sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {customer.phone}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOn sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {customer.location}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {customer.totalBookings} bookings
                  </Typography>
                  <Button size="small" variant="outlined" sx={{ color: '#b8192b', borderColor: '#b8192b' }}>
                    View Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default StaffCustomers;
