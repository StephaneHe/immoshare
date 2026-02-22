import { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller';
import { authenticate } from '../../common/middleware/authenticate';

/**
 * Register auth routes on a Fastify instance.
 * Prefix: /api/v1/auth
 */
export function authRoutes(app: FastifyInstance, controller: AuthController): void {
  // Public routes
  app.post('/api/v1/auth/register', controller.register);
  app.post('/api/v1/auth/login', controller.login);
  app.post('/api/v1/auth/refresh', controller.refresh);
  app.post('/api/v1/auth/verify-email', controller.verifyEmail);
  app.post('/api/v1/auth/forgot-password', controller.forgotPassword);
  app.post('/api/v1/auth/reset-password', controller.resetPassword);

  // Authenticated routes
  app.post('/api/v1/auth/logout', { preHandler: [authenticate] }, controller.logout);
  app.post('/api/v1/auth/change-password', { preHandler: [authenticate] }, controller.changePassword);
}
