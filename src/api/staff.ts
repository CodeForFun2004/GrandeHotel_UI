import instance from './axios';

// Re-export instance for compatibility
export { instance };

// Calendar Event Types
export type CalendarEventType = 'reservation' | 'stay' | 'maintenance' | 'task';

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  roomNumber?: string;
  roomId?: number | string;
  stayId?: number | string;
  reservationId?: string;
  startsAt: string; // ISO datetime string
  endsAt: string;   // ISO datetime string
  status?: 'pending' | 'confirmed' | 'checked-in' | 'checked-out' | 'in-progress' | 'done';
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

export interface GetCalendarEventsParams {
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string;   // ISO date string (YYYY-MM-DD)
  type?: CalendarEventType | 'ALL';
  roomId?: string | number;
  roomNumber?: string;
  keyword?: string;
}

export interface GetCalendarEventsResponse {
  success: boolean;
  data: {
    events: CalendarEvent[];
    total: number;
    startDate: string;
    endDate: string;
  };
  message?: string;
}

/**
 * Get calendar events for staff
 * @param params Query parameters for filtering events
 * @returns Calendar events within the date range
 */
export const getCalendarEvents = async (
  params: GetCalendarEventsParams
): Promise<GetCalendarEventsResponse> => {
  const res = await instance.get<GetCalendarEventsResponse>('/staff/calendar/events', { params });
  return res.data;
};

