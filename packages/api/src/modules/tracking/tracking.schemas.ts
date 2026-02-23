import { z } from 'zod';

const trackEventTypes = ['page_opened', 'section_viewed', 'media_viewed', 'time_spent', 'page_closed'] as const;

export const trackEventSchema = z.object({
  token: z.string().uuid(),
  eventType: z.enum(trackEventTypes),
  metadata: z.record(z.any()).optional(),
});

export const heartbeatSchema = z.object({
  token: z.string().uuid(),
  durationSinceLastBeat: z.number().min(1).max(300),
  currentSection: z.string().optional(),
});

export const linkIdParam = z.object({
  id: z.string().uuid(),
});

export const propertyIdParam = z.object({
  id: z.string().uuid(),
});

export const dashboardQuery = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
