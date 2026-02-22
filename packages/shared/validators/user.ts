import { z } from 'zod';

export const UpdateProfileDto = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  phone: z.string().max(20).optional(),
  locale: z.enum(['he', 'en', 'fr']).optional(),
});

export const ChangePasswordDto = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one digit'),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileDto>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordDto>;
