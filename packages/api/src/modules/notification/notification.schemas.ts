import { z } from 'zod';

export const notificationListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  unread: z.enum(['true', 'false']).optional(),
});

export const notificationIdParam = z.object({
  id: z.string().uuid(),
});

export const updateSettingsSchema = z.object({
  pushEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  reminderNoOpenDays: z.number().int().min(1).max(30).optional(),
  linkExpiryAlertDays: z.number().int().min(1).max(30).optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  disabledTypes: z.array(z.string()).optional(),
});

export const registerPushTokenSchema = z.object({
  token: z.string().min(1).max(500),
  platform: z.enum(['ios', 'android', 'web']),
});

export const pushTokenIdParam = z.object({
  id: z.string().uuid(),
});
