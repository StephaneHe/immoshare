/**
 * Contact Service — API layer for contacts management (M5 Sharing)
 * Endpoints: GET/POST/PATCH/DELETE /api/v1/contacts
 */
import { api } from './api';

export type Contact = {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContactListResponse = {
  contacts: Contact[];
  total: number;
  page: number;
  totalPages: number;
};

export type CreateContactData = {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
};

export type UpdateContactData = Partial<CreateContactData>;

export type ContactListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export const contactService = {
  async list(params: ContactListParams = {}): Promise<ContactListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    const qs = query.toString();
    const raw = await api.get<any>(`/api/v1/contacts${qs ? `?${qs}` : ''}`);
    // API returns { items, total, page, totalPages } — map items → contacts
    return {
      contacts: raw.items || raw.contacts || [],
      total: raw.total ?? 0,
      page: raw.page ?? 1,
      totalPages: raw.totalPages ?? 0,
    };
  },

  async getById(id: string): Promise<Contact> {
    return api.get<Contact>(`/api/v1/contacts/${id}`);
  },

  async create(data: CreateContactData): Promise<Contact> {
    return api.post<Contact>('/api/v1/contacts', data);
  },

  async update(id: string, data: UpdateContactData): Promise<Contact> {
    return api.patch<Contact>(`/api/v1/contacts/${id}`, data);
  },

  async remove(id: string): Promise<void> {
    return api.delete<void>(`/api/v1/contacts/${id}`);
  },
};
