import { z } from 'zod';

export const acceptCodeSchema = z.object({
  code: z.string().min(8).max(8),
});

export const reshareRequestSchema = z.object({
  propertyId: z.string().uuid(),
  message: z.string().max(500).optional(),
});

export const inviteIdParam = z.object({
  id: z.string().uuid(),
});

export const invitePropertyParam = z.object({
  inviteId: z.string().uuid(),
  id: z.string().uuid(),
});
