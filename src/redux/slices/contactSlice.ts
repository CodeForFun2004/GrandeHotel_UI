import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import * as contactApi from '../../api/contact';
import type { Contact } from '../../types/entities';

type ContactState = {
  contacts: Contact[];
  loading: boolean;
  error?: string | null;
};

const initialState: ContactState = { contacts: [], loading: false, error: null };

export const fetchContacts = createAsyncThunk<Contact[]>('contacts/fetchAll', async () => {
  const response = await contactApi.getAllContacts();
  return response.results;
});

export const updateContact = createAsyncThunk<Contact, { id: string; payload: Partial<Contact> }>(
  'contacts/update',
  async ({ id, payload }) => {
    return contactApi.updateContact(id, payload);
  }
);

const slice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchContacts.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchContacts.fulfilled, (s, a: PayloadAction<Contact[]>) => {
        s.loading = false;
        s.contacts = a.payload;
      })
      .addCase(fetchContacts.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message ?? 'Failed to load contacts';
      })

      .addCase(updateContact.pending, (s) => { s.loading = true; })
      .addCase(updateContact.fulfilled, (s, a: PayloadAction<Contact>) => {
        s.loading = false;
        const index = s.contacts.findIndex(c => c._id === a.payload._id || c.id === a.payload.id);
        if (index !== -1) {
          s.contacts[index] = a.payload;
        }
      })
      .addCase(updateContact.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message ?? 'Failed to update contact';
      });
  }
});

export default slice.reducer;
