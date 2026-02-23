import {
  INotificationDataProvider,
  ISettingsRepository,
} from '../notification.types';
import { NotificationService } from '../notification.service';

/**
 * Job: Check for share links expiring within X days.
 * Creates a link_expiring notification for each.
 */
export class LinkExpiringJob {
  constructor(
    private readonly dataProvider: INotificationDataProvider,
    private readonly settingsRepo: ISettingsRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async run(): Promise<{ notified: number; skipped: number }> {
    let notified = 0;
    let skipped = 0;

    // Default 7 days
    const links = await this.dataProvider.findExpiringLinks(7);

    for (const link of links) {
      const settings = await this.settingsRepo.findByUser(link.userId);
      const alertDays = settings?.linkExpiryAlertDays ?? 7;
      const deadline = new Date(Date.now() + alertDays * 24 * 3600 * 1000);

      // Only notify if link expires within the user's alert window
      if (link.expiresAt > deadline) {
        skipped++;
        continue;
      }

      const daysLeft = Math.ceil((link.expiresAt.getTime() - Date.now()) / (24 * 3600 * 1000));

      try {
        await this.notificationService.notify(
          link.userId,
          'link_expiring',
          'Lien expirant bientôt',
          `Le lien pour "${link.propertyTitle}" envoyé à ${link.contactName} expire dans ${daysLeft} jour(s).`,
          {
            linkId: link.linkId,
            propertyId: link.propertyId,
            expiresAt: link.expiresAt.toISOString(),
          },
        );
        await this.dataProvider.markExpiryAlertSent(link.linkId);
        notified++;
      } catch {
        skipped++;
      }
    }

    return { notified, skipped };
  }
}
