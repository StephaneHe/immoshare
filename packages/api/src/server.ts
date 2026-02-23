import Fastify from 'fastify';
import prisma from './common/prisma';
import { errorHandler } from './common/middleware/errorHandler';
import './common/types/request';

// Barrel imports — one per module
import { AuthService, AuthController, authRoutes, PrismaAuthRepository } from './modules/auth';
import { AgencyService, AgencyInviteService, AgencyController, agencyRoutes, PrismaAgencyRepository, PrismaAgencyInviteRepository } from './modules/agency';
import { PropertyService, PropertyController, propertyRoutes, PrismaPropertyRepository } from './modules/property';
import { PageService, PageController, pageRoutes, PrismaPageRepository, PrismaPageDataProvider } from './modules/page';
import { ContactService, ContactController, ShareService, ShareController, shareRoutes, PrismaContactRepository, PrismaShareLinkRepository, PrismaShareBatchRepository, PrismaShareDataProvider } from './modules/share';
import { TrackingService, AnalyticsService, TrackingController, trackingRoutes, PrismaTrackEventRepository, PrismaTrackingDataProvider } from './modules/tracking';
import { PartnerInviteService, PartnerCatalogService, ReshareService, PartnerController, partnerRoutes, PrismaPartnerInviteRepository, PrismaReshareRepository, PrismaPartnerDataProvider } from './modules/partner';
import { NotificationService, NotificationController, notificationRoutes, FcmPushProvider, PrismaNotificationRepository, PrismaSettingsRepository, PrismaPushTokenRepository } from './modules/notification';
import { BrandingService, BrandingController, brandingRoutes, PrismaBrandingRepository, PrismaBrandingDataProvider } from './modules/branding';

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

  // Wire M7 — Partners & Reshare
  const partnerInviteRepo = new PrismaPartnerInviteRepository(prisma);
  const reshareRepo = new PrismaReshareRepository(prisma);
  const partnerDataProvider = new PrismaPartnerDataProvider(prisma);
  const partnerInviteService = new PartnerInviteService(partnerInviteRepo, reshareRepo, partnerDataProvider);
  const partnerCatalogService = new PartnerCatalogService(partnerInviteRepo, partnerDataProvider);
  const reshareService = new ReshareService(reshareRepo, partnerInviteRepo, partnerDataProvider);
  const partnerController = new PartnerController(partnerInviteService, partnerCatalogService, reshareService);
  partnerRoutes(app, partnerController);

  // Wire M8 — Notifications
  const notifRepo = new PrismaNotificationRepository(prisma);
  const settingsRepo = new PrismaSettingsRepository(prisma);
  const pushTokenRepo = new PrismaPushTokenRepository(prisma);
  const pushProvider = new FcmPushProvider();
  const notificationService = new NotificationService(notifRepo, settingsRepo, pushTokenRepo, pushProvider);
  const notificationController = new NotificationController(notificationService, settingsRepo, pushTokenRepo);
  notificationRoutes(app, notificationController);

  // Wire M9 — Branding
  const brandingRepo = new PrismaBrandingRepository(prisma);
  const brandingDataProvider = new PrismaBrandingDataProvider(prisma);
  const brandingService = new BrandingService(brandingRepo, brandingDataProvider);
  const brandingController = new BrandingController(brandingService);
  brandingRoutes(app, brandingController);

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
