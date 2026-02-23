import { FastifyInstance } from 'fastify';
import { NotificationController } from './notification.controller';
import { authenticate } from '../../common/middleware/authenticate';

export function notificationRoutes(app: FastifyInstance, controller: NotificationController) {
  // Notifications
  app.get('/api/v1/notifications', { preHandler: authenticate }, controller.list);
  app.get('/api/v1/notifications/unread-count', { preHandler: authenticate }, controller.unreadCount);
  app.patch('/api/v1/notifications/:id/read', { preHandler: authenticate }, controller.markRead);
  app.post('/api/v1/notifications/read-all', { preHandler: authenticate }, controller.markAllRead);
  app.delete('/api/v1/notifications/:id', { preHandler: authenticate }, controller.deleteNotification);

  // Settings
  app.get('/api/v1/notification-settings', { preHandler: authenticate }, controller.getSettings);
  app.patch('/api/v1/notification-settings', { preHandler: authenticate }, controller.updateSettings);

  // Push tokens
  app.post('/api/v1/push-tokens', { preHandler: authenticate }, controller.registerPushToken);
  app.delete('/api/v1/push-tokens/:id', { preHandler: authenticate }, controller.deletePushToken);
}
