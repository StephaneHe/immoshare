import { FastifyRequest, FastifyReply } from 'fastify';
import { TrackingService } from './tracking.service';
import { AnalyticsService } from './analytics.service';
import { trackEventSchema, heartbeatSchema, linkIdParam, propertyIdParam, dashboardQuery } from './tracking.schemas';
import { ok } from '../../common/utils/apiResponse';

export class TrackingController {
  constructor(
    private readonly trackingService: TrackingService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  // ─── Collection (public, no auth) ───

  trackEvent = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = trackEventSchema.parse(req.body);
    const ip = req.ip || null;
    const ua = req.headers['user-agent'] || null;

    const event = await this.trackingService.recordEvent(body, ip, ua);
    return reply.status(200).send(ok(event ? { recorded: true } : { recorded: false, reason: 'duplicate' }));
  };

  heartbeat = async (req: FastifyRequest, reply: FastifyReply) => {
    const body = heartbeatSchema.parse(req.body);
    const ip = req.ip || null;
    const ua = req.headers['user-agent'] || null;

    await this.trackingService.recordHeartbeat(body, ip, ua);
    return reply.status(200).send(ok({ recorded: true }));
  };

  // ─── Consultation (authenticated) ───

  getLinkEvents = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = linkIdParam.parse(req.params);
    const events = await this.trackingService.getLinkEvents(id);
    return reply.send(ok({ events }));
  };

  getPropertyAnalytics = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = propertyIdParam.parse(req.params);
    const userId = req.user!.sub;
    const analytics = await this.analyticsService.getPropertyAnalytics(id, userId);
    return reply.send(ok(analytics));
  };

  getDashboard = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.user!.sub;
    const query = dashboardQuery.parse(req.query);
    const from = query.from ? new Date(query.from) : new Date(Date.now() - 30 * 86400000);
    const to = query.to ? new Date(query.to) : new Date();

    const dashboard = await this.analyticsService.getDashboard(userId, from, to);
    return reply.send(ok(dashboard));
  };
}
