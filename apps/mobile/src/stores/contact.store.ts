/**
 * Contact Store — state management for contacts (M5)
 */
import { create } from 'zustand';
import {
  contactService,
  Contact,
  CreateContactData,
  UpdateContactData,
} from '../services/contact.service';

type ContactState = {
  contacts: Contact[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  search: string;

  fetchContacts: (page?: number) => Promise<void>;
  setSearch: (search: string) => void;
  createContact: (data: CreateContactData) => Promise<Contact>;
  updateContact: (id: string, data: UpdateContactData) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
};

export const useContactStore = create<ContactState>((set, get) => ({
  contacts: [],
  total: 0,
  page: 1,
  totalPages: 0,
  isLoading: false,
  error: null,
  search: '',

  fetchContacts: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const result = await contactService.list({
        page,
        limit: 20,
        search: get().search || undefined,
      });
      set({
        contacts: page === 1 ? result.contacts : [...get().contacts, ...result.contacts],
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        isLoading: false,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load contacts', isLoading: false });
    }
  },

  setSearch: (search: string) => {
    set({ search });
  },

  createContact: async (data: CreateContactData) => {
    const contact = await contactService.create(data);
    set((state) => ({ contacts: [contact, ...state.contacts], total: state.total + 1 }));
    return contact;
  },

  updateContact: async (id: string, data: UpdateContactData) => {
    const updated = await contactService.update(id, data);
    set((state) => ({
      contacts: state.contacts.map((c) => (c.id === id ? updated : c)),
    }));
  },

  deleteContact: async (id: string) => {
    await contactService.remove(id);
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== id),
      total: state.total - 1,
    }));
  },
}));
