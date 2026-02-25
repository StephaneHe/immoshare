/**
 * Partner Store — state management for partners and reshare (M7)
 */
import { create } from 'zustand';
import {
  partnerService,
  Partner,
  PartnerInvite,
  PartnerProperty,
  ReshareRequest,
} from '../services/partner.service';

type PartnerState = {
  partners: Partner[];
  invites: PartnerInvite[];
  receivedReshares: ReshareRequest[];
  sentReshares: ReshareRequest[];
  catalogProperties: PartnerProperty[];
  isLoading: boolean;
  error: string | null;

  fetchPartners: () => Promise<void>;
  createInvite: () => Promise<PartnerInvite>;
  acceptInvite: (code: string) => Promise<void>;
  removePartner: (inviteId: string) => Promise<void>;
  fetchCatalog: (inviteId: string) => Promise<void>;
  createReshareRequest: (propertyId: string, inviteId: string) => Promise<void>;
  approveReshare: (id: string) => Promise<void>;
  rejectReshare: (id: string) => Promise<void>;
};

export const usePartnerStore = create<PartnerState>((set) => ({
  partners: [],
  invites: [],
  receivedReshares: [],
  sentReshares: [],
  catalogProperties: [],
  isLoading: false,
  error: null,

  fetchPartners: async () => {
    set({ isLoading: true, error: null });
    try {
      const [partners, received, sent] = await Promise.all([
        partnerService.listPartners(),
        partnerService.listReceivedReshareRequests(),
        partnerService.listSentReshareRequests(),
      ]);
      set({ partners, receivedReshares: received, sentReshares: sent, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load partners', isLoading: false });
    }
  },

  createInvite: async () => {
    const invite = await partnerService.createInvite();
    set((state) => ({ invites: [invite, ...state.invites] }));
    return invite;
  },

  acceptInvite: async (code: string) => {
    const partner = await partnerService.acceptInvite(code);
    set((state) => ({ partners: [...state.partners, partner] }));
  },

  removePartner: async (inviteId: string) => {
    await partnerService.removePartner(inviteId);
    set((state) => ({
      partners: state.partners.filter((p) => p.inviteId !== inviteId),
    }));
  },

  fetchCatalog: async (inviteId: string) => {
    set({ isLoading: true });
    try {
      const properties = await partnerService.listPartnerProperties(inviteId);
      set({ catalogProperties: properties, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load catalog', isLoading: false });
    }
  },

  createReshareRequest: async (propertyId: string, inviteId: string) => {
    const request = await partnerService.createReshareRequest(propertyId, inviteId);
    set((state) => ({ sentReshares: [...state.sentReshares, request] }));
  },

  approveReshare: async (id: string) => {
    const updated = await partnerService.approveReshare(id);
    set((state) => ({
      receivedReshares: state.receivedReshares.map((r) => (r.id === id ? updated : r)),
    }));
  },

  rejectReshare: async (id: string) => {
    const updated = await partnerService.rejectReshare(id);
    set((state) => ({
      receivedReshares: state.receivedReshares.map((r) => (r.id === id ? updated : r)),
    }));
  },
}));
