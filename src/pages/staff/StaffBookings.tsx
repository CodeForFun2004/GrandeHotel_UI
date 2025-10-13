import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button } from '@mui/material';
import { CheckCircle, Cancel, AccessTime } from '@mui/icons-material';

const StaffBookings = () => {
  const bookings = [
    {
      id: 1,
      customerName: 'John Doe',
      roomNumber: '101',
      checkIn: '2024-01-15',
      checkOut: '2024-01-18',
      status: 'confirmed',
      total: '$360'
    },
    {
      id: 2,
      customerName: 'Jane Smith',
      roomNumber: '102',
      checkIn: '2024-01-16',
      checkOut: '2024-01-20',
      status: 'pending',
      total: '$720'
    },
    {
      id: 3,
      customerName: 'Bob Johnson',
      roomNumber: '201',
      checkIn: '2024-01-14',
      checkOut: '2024-01-16',
      status: 'cancelled',
      total: '$500'
    },
    {
      id: 4,
      customerName: 'Alice Brown',
      roomNumber: '103',
      checkIn: '2024-01-17',
      checkOut: '2024-01-19',
      status: 'confirmed',
      total: '$240'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle />;
      case 'pending':
        return <AccessTime />;
      case 'cancelled':
        return <Cancel />;
      default:
        return <AccessTime />;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ color: '#b8192b', fontWeight: 'bold' }}>
          Booking Management
        </Typography>
        <Button variant="contained" sx={{ backgroundColor: '#b8192b' }}>
          New Booking
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
        <Table sx={{ minWidth: 650 }} aria-label="bookings table">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Booking ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Room</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Check-in</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Check-out</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id} hover>
                <TableCell>#{booking.id}</TableCell>
                <TableCell>{booking.customerName}</TableCell>
                <TableCell>{booking.roomNumber}</TableCell>
                <TableCell>{booking.checkIn}</TableCell>
                <TableCell>{booking.checkOut}</TableCell>
                <TableCell>
                  <Chip
                    icon={getStatusIcon(booking.status)}
                    label={booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    color={getStatusColor(booking.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#b8192b' }}>
                  {booking.total}
                </TableCell>
                <TableCell>
                  <Button size="small" variant="outlined" sx={{ mr: 1 }}>
                    Edit
                  </Button>
                  <Button size="small" variant="outlined" color="error">
                    Cancel
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default StaffBookings;
