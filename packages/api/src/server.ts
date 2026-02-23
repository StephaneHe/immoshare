import Fastify from 'fastify';
import prisma from './common/prisma';
import { AuthService } from './modules/auth/auth.service';
import { AuthController } from './modules/auth/auth.controller';
import { authRoutes } from './modules/auth/auth.routes';
import { AgencyService } from './modules/agency/agency.service';
import { AgencyInviteService } from './modules/agency/agency-invite.service';
import { AgencyController } from './modules/agency/agency.controller';
import { agencyRoutes } from './modules/agency/agency.routes';
import { PrismaAgencyRepository, PrismaAgencyInviteRepository } from './modules/agency/agency.repository';
import { PropertyService } from './modules/property/property.service';
import { PropertyController } from './modules/property/property.controller';
import { propertyRoutes } from './modules/property/property.routes';
import { PrismaPropertyRepository } from './modules/property/property.repository';
import { PageService } from './modules/page/page.service';
import { PageController } from './modules/page/page.controller';
import { pageRoutes } from './modules/page/page.routes';
import { PrismaPageRepository, PrismaPageDataProvider } from './modules/page/page.repository';
import { ContactService } from './modules/share/contact.service';
import { ContactController } from './modules/share/contact.controller';
import { ShareService } from './modules/share/share.service';
import { ShareController } from './modules/share/share.controller';
import { shareRoutes } from './modules/share/share.routes';
import {
  PrismaContactRepository,
  PrismaShareLinkRepository,
  PrismaShareBatchRepository,
  PrismaShareDataProvider,
} from './modules/share/share.repository';
import { TrackingService } from './modules/tracking/tracking.service';
import { AnalyticsService } from './modules/tracking/analytics.service';
import { TrackingController } from './modules/tracking/tracking.controller';
import { trackingRoutes } from './modules/tracking/tracking.routes';
import { PrismaTrackEventRepository, PrismaTrackingDataProvider } from './modules/tracking/tracking.repository';
import { errorHandler } from './common/middleware/errorHandler';
import { PrismaAuthRepository } from './modules/auth/auth.repository';
import './common/types/request';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  const app = Fastify({
    logger: { level: process.env.LOG_LEVEL || 'info' },
  });

  app.setErrorHandler(errorHandler);
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Wire M1 — Auth
  const authRepo = new PrismaAuthRepository(prisma);
  const authService = new AuthService(authRepo);
  const authController = new AuthController(authService);
  authRoutes(app, authController);

  // Wire M2 — Agencies
  const agencyRepo = new PrismaAgencyRepository(prisma);
  const agencyInviteRepo = new PrismaAgencyInviteRepository(prisma);
  const agencyService = new AgencyService(agencyRepo, agencyInviteRepo);
  const agencyInviteService = new AgencyInviteService(agencyRepo, agencyInviteRepo);
  const agencyController = new AgencyController(agencyService, agencyInviteService);
  agencyRoutes(app, agencyController);

  // Wire M3 — Properties
  const propertyRepo = new PrismaPropertyRepository(prisma);
  const propertyService = new PropertyService(propertyRepo);
  const propertyController = new PropertyController(propertyService);
  propertyRoutes(app, propertyController);

  // Wire M4 — Pages
  const pageRepo = new PrismaPageRepository(prisma);
  const pageDataProvider = new PrismaPageDataProvider(prisma);
  const pageService = new PageService(pageRepo, pageDataProvider);
  const pageController = new PageController(pageService);
  pageRoutes(app, pageController);

  // Wire M5 — Contacts & Sharing
  const contactRepo = new PrismaContactRepository(prisma);
  const contactService = new ContactService(contactRepo);
  const contactController = new ContactController(contactService);
  const shareLinkRepo = new PrismaShareLinkRepository(prisma);
  const shareBatchRepo = new PrismaShareBatchRepository(prisma);
  const shareDataProvider = new PrismaShareDataProvider(prisma);
  const shareService = new ShareService(shareLinkRepo, shareBatchRepo, contactRepo, shareDataProvider);
  const shareController = new ShareController(shareService, pageService);
  shareRoutes(app, contactController, shareController);

  // Wire M6 — Tracking & Analytics
  const trackEventRepo = new PrismaTrackEventRepository(prisma);
  const trackingDataProvider = new PrismaTrackingDataProvider(prisma);
  const trackingService = new TrackingService(trackEventRepo, trackingDataProvider);
  const analyticsService = new AnalyticsService(trackingDataProvider);
  const trackingController = new TrackingController(trackingService, analyticsService);
  trackingRoutes(app, trackingController);

  // Graceful shutdown
  const shutdown = async () => {
    app.log.info('Shutting down...');
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Server listening on http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
