import Fastify, { FastifyInstance } from 'fastify';
import { AuthService } from '../../src/modules/auth/auth.service';
import { AuthController } from '../../src/modules/auth/auth.controller';
import { authRoutes } from '../../src/modules/auth/auth.routes';
import { errorHandler } from '../../src/common/middleware/errorHandler';
import '../../src/common/types/request'; // augment FastifyRequest

/**
 * Build a Fastify test app with the given AuthService instance.
 * Does NOT listen on a port — use app.inject() for testing.
 */
export function buildTestApp(authService: AuthService): FastifyInstance {
  const app = Fastify({ logger: false });

  // Global error handler
  app.setErrorHandler(errorHandler);

  // Register routes
  const authController = new AuthController(authService);
  authRoutes(app, authController);

  return app;
}
