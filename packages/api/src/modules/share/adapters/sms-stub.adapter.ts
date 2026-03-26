import { IChannelAdapter } from '../share.types';

/**
 * SMS stub adapter — logs messages to console instead of sending them.
 * Replace with a Twilio adapter when the Twilio account is ready.
 *
 * To switch to production:
 *   1. Set env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 *   2. Replace this file with twilio-sms.adapter.ts
 */
export class SmsStubAdapter implements IChannelAdapter {
  readonly channel = 'sms' as const;

  async send(params: {
    to: string;
    link: string;
    message?: string;
    propertyTitle: string;
    agentName: string;
  }): Promise<{ success: boolean; error?: string }> {
    const body = this.buildMessage(params);

    console.log('[SMS STUB] Would send SMS:');
    console.log(`  To:      ${params.to}`);
    console.log(`  Body:    ${body}`);
    console.log('  (No real SMS sent — stub mode)');

    return { success: true };
  }

  private buildMessage(params: {
    link: string;
    message?: string;
    propertyTitle: string;
    agentName: string;
  }): string {
    const intro = params.message?.trim()
      ? params.message.trim()
      : `${params.agentName} shared a property with you: ${params.propertyTitle}`;
    return `${intro}\n${params.link}`;
  }
}
