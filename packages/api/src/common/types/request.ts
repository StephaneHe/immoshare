import { UserRole } from '@immo-share/shared/constants/enums';

/**
 * Authenticated user payload extracted from JWT.
 * Attached to request.user by the authenticate middleware.
 */
export interface AuthUser {
  sub: string;       // userId
  email: string;
  role: UserRole;
}

/**
 * Extend FastifyRequest to include user context.
 */
declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}
