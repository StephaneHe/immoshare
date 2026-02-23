import { IPushProvider } from './notification.types';

/**
 * Stub FCM push provider.
 * In production, this will use firebase-admin SDK.
 * For now, it logs and returns success for all tokens.
 */
export class FcmPushProvider implements IPushProvider {
  async send(
    tokens: string[],
    payload: { title: string; body: string; data?: Record<string, unknown> },
  ) {
    // TODO: Replace with actual firebase-admin messaging
    // admin.messaging().sendEachForMulticast({ tokens, notification: { title, body }, data })
    // Stub: no-op until firebase-admin is configured
    return { successCount: tokens.length, failedTokens: [] as string[] };
  }
}
