import Fastify, { FastifyInstance } from 'fastify';
import { AuthService } from '../../src/modules/auth/auth.service';
import { AuthController } from '../../src/modules/auth/auth.controller';
import { authRoutes } from '../../src/modules/auth/auth.routes';
import { AgencyService } from '../../src/modules/agency/agency.service';
import { AgencyInviteService } from '../../src/modules/agency/agency-invite.service';
import { AgencyController } from '../../src/modules/agency/agency.controller';
import { agencyRoutes } from '../../src/modules/agency/agency.routes';
import { PropertyService } from '../../src/modules/property/property.service';
import { PropertyController } from '../../src/modules/property/property.controller';
import { propertyRoutes } from '../../src/modules/property/property.routes';
import { errorHandler } from '../../src/common/middleware/errorHandler';
import '../../src/common/types/request';

/**
 * Build a Fastify test app with the given AuthService instance.
 */
export function buildTestApp(authService: AuthService): FastifyInstance {
  const app = Fastify({ logger: false });
  app.setErrorHandler(errorHandler);
  const authController = new AuthController(authService);
  authRoutes(app, authController);
  return app;
}

/**
 * Build a Fastify test app with Agency services.
 */
export function buildAgencyTestApp(
  agencyService: AgencyService,
  inviteService: AgencyInviteService,
): FastifyInstance {
  const app = Fastify({ logger: false });
  app.setErrorHandler(errorHandler);
  const controller = new AgencyController(agencyService, inviteService);
  agencyRoutes(app, controller);
  return app;
}

/**
 * Build a Fastify test app with Property service.
 */
export function buildPropertyTestApp(propertyService: PropertyService): FastifyInstance {
  const app = Fastify({ logger: false });
  app.setErrorHandler(errorHandler);
  const controller = new PropertyController(propertyService);
  propertyRoutes(app, controller);
  return app;
}
