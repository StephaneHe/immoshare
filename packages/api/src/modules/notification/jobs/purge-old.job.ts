import { INotificationRepository } from '../notification.types';

/**
 * Job: Purge notifications older than 90 days.
 */
export class PurgeOldNotificationsJob {
  constructor(private readonly notifRepo: INotificationRepository) {}

  async run(): Promise<{ purged: number }> {
    const cutoff = new Date(Date.now() - 90 * 24 * 3600 * 1000);
    const purged = await this.notifRepo.purgeOlderThan(cutoff);
    return { purged };
  }
}
