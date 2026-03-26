import { IChannelAdapter } from '../share.types';

/**
 * Brevo (ex-Sendinblue) email adapter.
 *
 * Setup:
 *   1. Create a free account at https://www.brevo.com
 *   2. Go to Settings → API Keys → Generate API key
 *   3. Set env: BREVO_API_KEY=your-key
 *   4. Optionally set: BREVO_FROM_EMAIL, BREVO_FROM_NAME
 *
 * Free tier: 300 emails/day, no credit card required.
 */
export class BrevoEmailAdapter implements IChannelAdapter {
  readonly channel = 'email' as const;

  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor() {
    this.apiKey = process.env.BREVO_API_KEY || '';
    this.fromEmail = process.env.BREVO_FROM_EMAIL || 'noreply@immoshare.app';
    this.fromName = process.env.BREVO_FROM_NAME || 'ImmoShare';
  }

  get isConfigured(): boolean {
    return !!this.apiKey;
  }

  async send(params: {
    to: string;
    link: string;
    message?: string;
    propertyTitle: string;
    agentName: string;
  }): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured) {
      console.warn('[Brevo] BREVO_API_KEY not set — email not sent (stub mode)');
      console.log(`[Brevo STUB] Would email ${params.to} — property: ${params.propertyTitle}`);
      return { success: true };
    }

    const subject = `${params.agentName} shared a property with you: ${params.propertyTitle}`;
    const htmlContent = this.buildHtml(params);
    const textContent = this.buildText(params);

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': this.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: this.fromName, email: this.fromEmail },
          to: [{ email: params.to }],
          subject,
          htmlContent,
          textContent,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('[Brevo] API error:', response.status, errorBody);
        return { success: false, error: `Brevo error ${response.status}: ${errorBody}` };
      }

      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Brevo] Network error:', msg);
      return { success: false, error: msg };
    }
  }

  private buildText(params: {
    to: string;
    link: string;
    message?: string;
    propertyTitle: string;
    agentName: string;
  }): string {
    const intro = params.message?.trim() || `${params.agentName} has shared a property with you.`;
    return [
      intro,
      '',
      `Property: ${params.propertyTitle}`,
      `View it here: ${params.link}`,
      '',
      'Best regards,',
      params.agentName,
    ].join('\n');
  }

  private buildHtml(params: {
    link: string;
    message?: string;
    propertyTitle: string;
    agentName: string;
  }): string {
    const intro = params.message?.trim()
      ? `<p>${this.escapeHtml(params.message)}</p>`
      : `<p>${this.escapeHtml(params.agentName)} has shared a property with you.</p>`;

    return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1A1A2E;">🏠 ${this.escapeHtml(params.propertyTitle)}</h2>
  ${intro}
  <a href="${params.link}"
     style="display: inline-block; background-color: #0F3460; color: white;
            padding: 12px 24px; border-radius: 6px; text-decoration: none;
            font-size: 16px; margin: 16px 0;">
    View Property
  </a>
  <p style="color: #888; font-size: 12px;">
    This link is personal and expires after 30 days.
  </p>
  <hr style="border: none; border-top: 1px solid #eee; margin-top: 32px;">
  <p style="color: #888; font-size: 12px;">
    Sent via <strong>ImmoShare</strong> by ${this.escapeHtml(params.agentName)}
  </p>
</body>
</html>`.trim();
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
