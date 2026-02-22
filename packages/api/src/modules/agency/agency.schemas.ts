import { z } from 'zod';

export const createAgencySchema = z.object({
  name: z.string().min(2).max(100),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
});

export const updateAgencySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  logoUrl: z.string().url().optional(),
});

export const inviteAgentSchema = z.object({
  email: z.string().email(),
});

export const agencyIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const agentRemoveParamSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
});

export const inviteIdParamSchema = z.object({
  id: z.string().uuid(),
  inviteId: z.string().uuid(),
});

export const inviteTokenParamSchema = z.object({
  token: z.string().uuid(),
});

export const transferAdminSchema = z.object({
  newAdminId: z.string().uuid(),
});
