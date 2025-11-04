import axios from './axios';

export interface Customer {
  Account_ID: string;
  FirstName: string;
  LastName: string;
  Email: string;
  PhoneNumber: string;
  Status: 'active' | 'banned';
}

export interface Hotel {
  Hotel_ID: string;
  Name: string;
  Address: string;
}

export interface Booking {
  Reservation_ID: string;
  Status: 'confirmed' | 'pending';
  CheckIn: string; // YYYY-MM-DD
  CheckOut: string; // YYYY-MM-DD
}

export interface Message {
  id: string;
  from: 'customer' | 'staff';
  text: string;
  time: string; // ISO string
}

export interface Conversation {
  threadId: string;
  customer?: Customer; // Only in staff responses
  hotel?: Hotel; // Only in customer list responses
  hotelId?: string; // Only in staff responses
  lastMessageAt: string;
  unread: number;
  pinned: boolean;
  booking?: Booking | null;
  messages: Message[];
}

export interface GetConversationsParams {
  hotelId?: string;
  query?: string;
  tab?: 'all' | 'unread' | 'active';
}

export interface SendMessageData {
  text: string;
}

// Staff endpoints
export const getStaffConversations = async (params: GetConversationsParams): Promise<Conversation[]> => {
  const response = await axios.get('/staff/conversations', { params });
  return response.data;
};

export const getStaffConversation = async (threadId: string): Promise<Conversation> => {
  const response = await axios.get(`/staff/conversations/${threadId}`);
  return response.data;
};

export const sendStaffMessage = async (threadId: string, data: SendMessageData): Promise<{ message: any }> => {
  const response = await axios.post(`/staff/conversations/${threadId}/messages`, data);
  return response.data;
};

export const markStaffRead = async (threadId: string): Promise<void> => {
  await axios.put(`/staff/conversations/${threadId}/read`);
};

export const toggleStaffPin = async (threadId: string, pinned: boolean): Promise<void> => {
  await axios.put(`/staff/conversations/${threadId}/pin`, { pinned });
};

// Customer endpoints
export const getCustomerConversations = async (params?: { query?: string; tab?: 'all' | 'unread' | 'active' }): Promise<Conversation[]> => {
  const response = await axios.get('/customer/conversations', { params });
  return response.data;
};

export const getCustomerConversation = async (threadId: string): Promise<Conversation> => {
  const response = await axios.get(`/customer/conversations/${threadId}`);
  return response.data;
};

export const sendCustomerMessage = async (threadId: string, data: SendMessageData): Promise<{ message: any }> => {
  const response = await axios.post(`/customer/conversations/${threadId}/messages`, data);
  return response.data;
};
