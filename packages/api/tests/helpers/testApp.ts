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
import { PageService } from '../../src/modules/page/page.service';
import { PageController } from '../../src/modules/page/page.controller';
import { pageRoutes } from '../../src/modules/page/page.routes';
import { ContactService } from '../../src/modules/share/contact.service';
import { ContactController } from '../../src/modules/share/contact.controller';
import { ShareService } from '../../src/modules/share/share.service';
import { ShareController } from '../../src/modules/share/share.controller';
import { shareRoutes } from '../../src/modules/share/share.routes';
import { errorHandler } from '../../src/common/middleware/errorHandler';
import '../../src/common/types/request';

export function buildTestApp(authService: AuthService): FastifyInstance {
  const app = Fastify({ logger: false });
  app.setErrorHandler(errorHandler);
  const authController = new AuthController(authService);
  authRoutes(app, authController);
  return app;
}

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

export function buildPropertyTestApp(propertyService: PropertyService): FastifyInstance {
  const app = Fastify({ logger: false });
  app.setErrorHandler(errorHandler);
  const controller = new PropertyController(propertyService);
  propertyRoutes(app, controller);
  return app;
}

export function buildPageTestApp(pageService: PageService): FastifyInstance {
  const app = Fastify({ logger: false });
  app.setErrorHandler(errorHandler);
  const controller = new PageController(pageService);
  pageRoutes(app, controller);
  return app;
}

export function buildShareTestApp(
  contactService: ContactService,
  shareService: ShareService,
  pageService: PageService,
): FastifyInstance {
  const app = Fastify({ logger: false });
  app.setErrorHandler(errorHandler);
  const contactController = new ContactController(contactService);
  const shareController = new ShareController(shareService, pageService);
  shareRoutes(app, contactController, shareController);
  return app;
}

import { TrackingService } from '../../src/modules/tracking/tracking.service';
import { AnalyticsService } from '../../src/modules/tracking/analytics.service';
import { TrackingController } from '../../src/modules/tracking/tracking.controller';
import { trackingRoutes } from '../../src/modules/tracking/tracking.routes';

export function buildTrackingTestApp(
  trackingService: TrackingService,
  analyticsService: AnalyticsService,
): FastifyInstance {
  const app = Fastify({ logger: false });
  app.setErrorHandler(errorHandler);
  const controller = new TrackingController(trackingService, analyticsService);
  trackingRoutes(app, controller);
  return app;
}

import { PartnerInviteService } from '../../src/modules/partner/partner-invite.service';
import { PartnerCatalogService } from '../../src/modules/partner/partner-catalog.service';
import { ReshareService } from '../../src/modules/partner/reshare.service';
import { PartnerController } from '../../src/modules/partner/partner.controller';
import { partnerRoutes } from '../../src/modules/partner/partner.routes';

export function buildPartnerTestApp(
  inviteService: PartnerInviteService,
  catalogService: PartnerCatalogService,
  reshareService: ReshareService,
): FastifyInstance {
  const app = Fastify({ logger: false });
  app.setErrorHandler(errorHandler);
  const controller = new PartnerController(inviteService, catalogService, reshareService);
  partnerRoutes(app, controller);
  return app;
}

// ─── M8 Notification test app ───

import { NotificationService } from '../../src/modules/notification/notification.service';
import { NotificationController } from '../../src/modules/notification/notification.controller';
import { notificationRoutes } from '../../src/modules/notification/notification.routes';
import { ISettingsRepository, IPushTokenRepository } from '../../src/modules/notification/notification.types';

export function buildNotificationTestApp(
  service: NotificationService,
  settingsRepo: ISettingsRepository,
  pushTokenRepo: IPushTokenRepository,
) {
  const app = Fastify({ logger: false });
  app.setErrorHandler(errorHandler);
  const controller = new NotificationController(service, settingsRepo, pushTokenRepo);
  notificationRoutes(app, controller);
  return app;
}
