import { FastifyRequest, FastifyReply } from 'fastify';
import { NotificationService } from './notification.service';
import { ISettingsRepository, IPushTokenRepository, UpdateSettingsInput } from './notification.types';
import { PushTokenNotFoundError } from './notification.errors';
import {
  notificationListQuery,
  notificationIdParam,
  updateSettingsSchema,
  registerPushTokenSchema,
  pushTokenIdParam,
} from './notification.schemas';
import { ok } from '../../common/utils/apiResponse';

export class NotificationController {
  constructor(
    private readonly service: NotificationService,
    private readonly settingsRepo: ISettingsRepository,
    private readonly pushTokenRepo: IPushTokenRepository,
  ) {}

  // ─── Notifications ───

  list = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.user!.sub;
    const q = notificationListQuery.parse(req.query);
    const notifications = await this.service.list(userId, q.limit, q.offset, q.unread === 'true' ? true : undefined);
    return reply.send(ok({ notifications }));
  };

  unreadCount = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.user!.sub;
    const count = await this.service.getUnreadCount(userId);
    return reply.send(ok({ count }));
  };

  markRead = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = notificationIdParam.parse(req.params);
    const userId = req.user!.sub;
    const notif = await this.service.markRead(id, userId);
    return reply.send(ok(notif));
  };

  markAllRead = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.user!.sub;
    const count = await this.service.markAllRead(userId);
    return reply.send(ok({ marked: count }));
  };

  deleteNotification = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = notificationIdParam.parse(req.params);
    const userId = req.user!.sub;
    await this.service.deleteNotification(id, userId);
    return reply.send(ok({ deleted: true }));
  };

  // ─── Settings ───

  getSettings = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.user!.sub;
    const settings = await this.service.getSettings(userId);
    return reply.send(ok(settings));
  };

  updateSettings = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.user!.sub;
    const data = updateSettingsSchema.parse(req.body) as UpdateSettingsInput;
    const settings = await this.settingsRepo.upsert(userId, data);
    return reply.send(ok(settings));
  };

  // ─── Push Tokens ───

  registerPushToken = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.user!.sub;
    const { token, platform } = registerPushTokenSchema.parse(req.body);
    const pushToken = await this.pushTokenRepo.create(userId, token, platform);
    return reply.status(201).send(ok(pushToken));
  };

  deletePushToken = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = pushTokenIdParam.parse(req.params);
    const userId = req.user!.sub;
    const token = await this.pushTokenRepo.findById(id);
    if (!token || token.userId !== userId) throw new PushTokenNotFoundError();
    await this.pushTokenRepo.delete(id);
    return reply.send(ok({ deleted: true }));
  };
}
