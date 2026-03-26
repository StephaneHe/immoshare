import { WhatsAppStubAdapter } from '../../../src/modules/share/adapters/whatsapp-stub.adapter';
import { SmsStubAdapter } from '../../../src/modules/share/adapters/sms-stub.adapter';
import { BrevoEmailAdapter } from '../../../src/modules/share/adapters/brevo-email.adapter';

const SEND_PARAMS = {
  to: '+972501234567',
  link: 'https://app.immoshare.com/v/some-token',
  propertyTitle: 'Nice apartment in Tel Aviv',
  agentName: 'John Agent',
};

// ─── WhatsApp Stub ───

describe('WhatsAppStubAdapter', () => {
  it('should have channel = "whatsapp"', () => {
    const adapter = new WhatsAppStubAdapter();
    expect(adapter.channel).toBe('whatsapp');
  });

  it('should return success=true without throwing', async () => {
    const adapter = new WhatsAppStubAdapter();
    const result = await adapter.send(SEND_PARAMS);
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should work with a custom message', async () => {
    const adapter = new WhatsAppStubAdapter();
    const result = await adapter.send({ ...SEND_PARAMS, message: 'Check this out!' });
    expect(result.success).toBe(true);
  });
});

// ─── SMS Stub ───

describe('SmsStubAdapter', () => {
  it('should have channel = "sms"', () => {
    const adapter = new SmsStubAdapter();
    expect(adapter.channel).toBe('sms');
  });

  it('should return success=true without throwing', async () => {
    const adapter = new SmsStubAdapter();
    const result = await adapter.send(SEND_PARAMS);
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

// ─── Brevo Email (unconfigured — stub fallback) ───

describe('BrevoEmailAdapter (unconfigured)', () => {
  beforeEach(() => {
    delete process.env.BREVO_API_KEY;
  });

  it('should have channel = "email"', () => {
    const adapter = new BrevoEmailAdapter();
    expect(adapter.channel).toBe('email');
  });

  it('should return success=true in stub mode when no API key is set', async () => {
    const adapter = new BrevoEmailAdapter();
    const result = await adapter.send({ ...SEND_PARAMS, to: 'user@example.com' });
    expect(result.success).toBe(true);
  });

  it('should report isConfigured=false when no API key', () => {
    const adapter = new BrevoEmailAdapter();
    expect(adapter.isConfigured).toBe(false);
  });
});

// ─── Brevo Email (configured — mocked fetch) ───

describe('BrevoEmailAdapter (configured)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.BREVO_API_KEY = 'test-key-123';
  });

  afterEach(() => {
    delete process.env.BREVO_API_KEY;
    global.fetch = originalFetch;
  });

  it('should call Brevo API with correct payload on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messageId: 'msg-id' }),
    } as Response);

    const adapter = new BrevoEmailAdapter();
    const result = await adapter.send({ ...SEND_PARAMS, to: 'recipient@example.com' });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.brevo.com/v3/smtp/email',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'api-key': 'test-key-123' }),
      }),
    );
    expect(result.success).toBe(true);
  });

  it('should return success=false on Brevo API error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    } as unknown as Response);

    const adapter = new BrevoEmailAdapter();
    const result = await adapter.send({ ...SEND_PARAMS, to: 'recipient@example.com' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('401');
  });

  it('should return success=false on network error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network failure'));

    const adapter = new BrevoEmailAdapter();
    const result = await adapter.send({ ...SEND_PARAMS, to: 'recipient@example.com' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Network failure');
  });
});
