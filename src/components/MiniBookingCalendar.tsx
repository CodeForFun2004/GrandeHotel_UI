import React from 'react';
import { Box, Tooltip } from '@mui/material';

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;


type Booking = {
  checkIn?: string | number | Date;
  checkOut?: string | number | Date;
  start?: string | number | Date;
  end?: string | number | Date;
  guestName?: string;
  name?: string;
  reservation?: any;
  details?: any[];
  status?: string;
  [k: string]: any;
};

type Props = {
  bookings?: Booking[];
  month?: number; // 0-based
  year?: number;
  roomStatus?: string; // optional hint from parent (e.g. 'Occupied'|'Reserved')
};

export default function MiniBookingCalendar({ bookings = [], month, year, roomStatus }: Props) {
  const today = new Date();
  const y = typeof year === 'number' ? year : today.getFullYear();
  const m = typeof month === 'number' ? month : today.getMonth();

  const booked = new Set<string>();
  // details maps dateKey -> array of { booking, color }
  const details: Record<string, Array<{ booking: any; color?: string }>> = {};

  const normalizeRaw = (v: any): string | number | null => {
    if (v === null || v === undefined) return null;
    if (typeof v === 'string' || typeof v === 'number') return v;
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'object') {
      if ('$date' in v) {
        const d = v.$date;
        if (typeof d === 'string' || typeof d === 'number') return d;
        if (d && typeof d === 'object' && '$numberLong' in d) return Number(d.$numberLong);
      }
      if ('$numberLong' in v) return Number(v.$numberLong);
      // some libs use { $value: '2025-11-05' }
      if ('$value' in v) return v.$value;
    }
    return null;
  };

  const pickDate = (obj: any, keys: string[]) => {
    if (!obj) return null;
    for (const k of keys) {
      const raw = normalizeRaw(obj[k]);
      if (!raw && raw !== 0) continue;
      const d = new Date(raw as any);
      if (isNaN(d.getTime())) continue;
      // Normalize to local midnight to avoid timezone-driven off-by-one days
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    return null;
  };

  // Compute color hint for a booking
  const ROOM_STATUS_COLOR: Record<string, string> = {
    Reserved: '#ffb300', // amber
    Occupied: '#1976d2', // blue
    'Under Maintenance': '#6a1b9a',
  };

  bookings.forEach((b) => {
    const start = pickDate(b, ['checkIn', 'checkInDate', 'start', 'startDate', 'from', 'arrival', 'begin'])
      || pickDate(b?.reservation, ['checkIn', 'checkInDate', 'start', 'startDate', 'from']);
    const end = pickDate(b, ['checkOut', 'checkOutDate', 'end', 'endDate', 'to', 'departure', 'finish'])
      || pickDate(b?.reservation, ['checkOut', 'checkOutDate', 'end', 'endDate', 'to']);
    if (!start || !end) return;

    let color: string | undefined;

    // Priority 1: per-room status inside details
    if (Array.isArray(b.details)) {
      for (const det of b.details) {
        if (!Array.isArray(det.reservedRooms)) continue;
        for (const rr of det.reservedRooms) {
          const rrStatus = rr?.status ?? (typeof rr === 'string' ? null : undefined);
          if (rrStatus === 'Occupied') { color = ROOM_STATUS_COLOR['Occupied']; break; }
          if (rrStatus === 'Reserved' && !color) color = ROOM_STATUS_COLOR['Reserved'];
        }
        if (color) break;
      }
    }

    // Priority 2: reservation-level status
    if (!color) {
      const resStatus = (b.status || b.reservation?.status || b.reservationStatus || '').toString().toLowerCase();
      if (resStatus.includes('checked') || resStatus.includes('occupied')) color = ROOM_STATUS_COLOR['Occupied'];
      // treat common booking statuses (pending/approved/paid/confirmed/reserved) as Reserved color
      else if (
        resStatus.includes('approved') ||
        resStatus.includes('paid') ||
        resStatus.includes('confirmed') ||
        resStatus.includes('reserved') ||
        resStatus.includes('pending')
      )
        color = ROOM_STATUS_COLOR['Reserved'];
    }

    // Priority 3: fallback to provided roomStatus prop (if present)
    if (!color && roomStatus) {
      if (roomStatus.toLowerCase().includes('occup')) color = ROOM_STATUS_COLOR['Occupied'];
      else if (roomStatus.toLowerCase().includes('reserv')) color = ROOM_STATUS_COLOR['Reserved'];
    }

    // include end date (inclusive)
    for (let d = new Date(start.getFullYear(), start.getMonth(), start.getDate()); d <= end; d.setDate(d.getDate() + 1)) {
      const k = dateKey(d);
      booked.add(k);
      details[k] = details[k] || [];
      details[k].push({ booking: b, color });
    }
  });

  // Debug: if no bookings were marked, log the incoming bookings for diagnosis
  if (bookings.length > 0 && booked.size === 0) {
    // eslint-disable-next-line no-console
    console.debug('MiniBookingCalendar: received bookings but parsed 0 booked days', bookings);
  }

  const first = new Date(y, m, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < startDay; i++) cells.push(<Box key={`b-${i}`} />);
  for (let d = 1; d <= daysInMonth; d++) {
    const cur = new Date(y, m, d);
    const k = dateKey(cur);
    const isBooked = booked.has(k);

    // choose color if any booking for this date has a color hint (priority: Occupied > Reserved)
    let cellColor: string | undefined;
      if (isBooked && details[k]) {
      // details[k] is array of { booking, color }
      for (const it of details[k]) {
        if (it.color === ROOM_STATUS_COLOR['Occupied']) { cellColor = it.color; break; }
      }
      if (!cellColor) cellColor = details[k][0]?.color ?? ROOM_STATUS_COLOR['Reserved'];
    }

    const formatBookingLabel = (x: any) => {
      const sRaw = normalizeRaw(x.booking?.checkIn ?? x.booking?.checkInDate ?? x.booking?.start ?? x.booking?.startDate ?? x.booking?.reservation?.checkIn ?? x.booking?.reservation?.checkInDate ?? x.booking?.from);
      const eRaw = normalizeRaw(x.booking?.checkOut ?? x.booking?.checkOutDate ?? x.booking?.end ?? x.booking?.endDate ?? x.booking?.reservation?.checkOut ?? x.booking?.reservation?.checkOutDate ?? x.booking?.to);
      const s = sRaw ? new Date(sRaw as any).toLocaleDateString('vi-VN') : '';
      const e = eRaw ? new Date(eRaw as any).toLocaleDateString('vi-VN') : '';
      return `${x.booking?.guestName ?? x.booking?.name ?? 'Khách'}: ${s} → ${e}`;
    };
    const tooltipText = (details[k] || []).map(formatBookingLabel).join('\n');

    // convert hex like #rrggbb to rgba with given alpha
    const hexToRgba = (hex: string, alpha = 0.18) => {
      if (!hex || hex[0] !== '#') return hex;
      const h = hex.replace('#', '');
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const bgColor = cellColor ? hexToRgba(cellColor, 0.2) : isBooked ? '#f0f0f0' : 'transparent';
    const borderStyle = cellColor ? `2px solid ${cellColor}` : undefined;

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
            bgcolor: bgColor,
            border: borderStyle,
            color: 'text.primary',
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
