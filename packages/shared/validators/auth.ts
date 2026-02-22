import { z } from 'zod';

export const RegisterDto = z.object({
  email: z.string().email().max(255),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one digit'),
  name: z.string().min(1).max(100).trim(),
  phone: z.string().max(20).optional(),
  role: z.enum(['agent', 'agency_admin']),
  locale: z.enum(['he', 'en', 'fr']).default('he'),
});

export const LoginDto = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const RefreshDto = z.object({
  refreshToken: z.string().uuid(),
});

export const VerifyEmailDto = z.object({
  token: z.string().uuid(),
});

export const ForgotPasswordDto = z.object({
  email: z.string().email(),
});

export const ResetPasswordDto = z.object({
  token: z.string().uuid(),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one digit'),
});

export type RegisterInput = z.infer<typeof RegisterDto>;
export type LoginInput = z.infer<typeof LoginDto>;
export type RefreshInput = z.infer<typeof RefreshDto>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailDto>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordDto>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordDto>;
