import React from 'react';
import { Box, Tooltip } from '@mui/material';

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

type Booking = {
  checkIn?: string;
  checkOut?: string;
  start?: string;
  end?: string;
  guestName?: string;
  name?: string;
};

type Props = {
  bookings?: Booking[];
  month?: number; // 0-based
  year?: number;
};

export default function MiniBookingCalendar({ bookings = [], month, year }: Props) {
  const today = new Date();
  const y = typeof year === 'number' ? year : today.getFullYear();
  const m = typeof month === 'number' ? month : today.getMonth();

  const booked = new Set<string>();
  const details: Record<string, any[]> = {};
  bookings.forEach((b) => {
    const start = new Date(b.checkIn ?? b.start ?? b.from ?? b.arrival);
    const end = new Date(b.checkOut ?? b.end ?? b.to ?? b.departure);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const k = dateKey(d);
      booked.add(k);
      details[k] = details[k] || [];
      details[k].push(b);
    }
  });

  const first = new Date(y, m, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < startDay; i++) cells.push(<Box key={`b-${i}`} />);
  for (let d = 1; d <= daysInMonth; d++) {
    const cur = new Date(y, m, d);
    const k = dateKey(cur);
    const isBooked = booked.has(k);
    const tooltipText = (details[k] || []).map((x: any) => `${x.guestName ?? x.name ?? 'Khách'}: ${x.checkIn ?? x.start ?? ''} → ${x.checkOut ?? x.end ?? ''}`).join('\n');
    cells.push(
      <Tooltip key={k} title={tooltipText || (isBooked ? 'Đã đặt' : 'Trống')} arrow>
        <Box
          sx={{
            width: 32,
            height: 32,
            display: 'inline-grid',
            placeItems: 'center',
            borderRadius: 1,
            mr: 0.5,
            mb: 0.5,
            bgcolor: isBooked ? '#f0f0f0' : 'transparent',
            color: isBooked ? 'text.secondary' : 'text.primary',
            fontSize: 12,
          }}
        >
          {d}
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
        {['CN','T2','T3','T4','T5','T6','T7'].map((h) => (
          <Box key={h} sx={{ fontSize: 11, color: 'text.secondary', textAlign: 'center' }}>{h}</Box>
        ))}
        {cells}
      </Box>
    </Box>
  );
}
