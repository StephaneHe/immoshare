import { IChannelAdapter } from '../share.types';

/**
 * WhatsApp stub adapter — logs messages to console instead of sending them.
 * Replace with a real WhatsApp Cloud API adapter when Meta Business account is ready.
 *
 * To switch to production:
 *   1. Set env: WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID
 *   2. Replace this file with whatsapp-cloud.adapter.ts
 */
export class WhatsAppStubAdapter implements IChannelAdapter {
  readonly channel = 'whatsapp' as const;

  async send(params: {
    to: string;
    link: string;
    message?: string;
    propertyTitle: string;
    agentName: string;
  }): Promise<{ success: boolean; error?: string }> {
    const body = this.buildMessage(params);

    console.log('[WhatsApp STUB] Would send message:');
    console.log(`  To:      ${params.to}`);
    console.log(`  Body:    ${body}`);
    console.log('  (No real WhatsApp message sent — stub mode)');

    return { success: true };
  }

  private buildMessage(params: {
    to: string;
    link: string;
    message?: string;
    propertyTitle: string;
    agentName: string;
  }): string {
    const intro = params.message?.trim()
      ? params.message.trim()
      : `Hi, I wanted to share a property with you: *${params.propertyTitle}*`;
    return `${intro}\n\n🏠 View the property page here:\n${params.link}\n\nBest regards,\n${params.agentName}`;
  }
}
