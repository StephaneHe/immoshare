/**
 * Tests for Branding Service + Store (M9)
 * Test plan: M9-01 through M9-06
 */
import { api } from '../../src/services/api';
import { brandingService } from '../../src/services/branding.service';
import { useBrandingStore } from '../../src/stores/branding.store';

jest.mock('../../src/services/api', () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const mockApi = api as jest.Mocked<typeof api>;

const fakeBranding = {
  id: 'br1', userId: 'u1', agencyId: null,
  primaryColor: '#C8102E', accentColor: '#1A1A2E',
  fontFamily: null, tagline: 'Best Properties',
  logoUrl: 'https://example.com/logo.png', photoUrl: null,
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  useBrandingStore.setState({ branding: null, isLoading: false, error: null });
});

describe('Branding Service', () => {
  it('get() calls GET /branding', async () => {
    mockApi.get.mockResolvedValue(fakeBranding);
    await brandingService.get();
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/branding');
  });

  it('update() calls PATCH /branding', async () => {
    mockApi.patch.mockResolvedValue({ ...fakeBranding, tagline: 'New Tagline' });
    await brandingService.update({ tagline: 'New Tagline' });
    expect(mockApi.patch).toHaveBeenCalledWith('/api/v1/branding', { tagline: 'New Tagline' });
  });

  it('uploadLogo() calls POST /branding/logo', async () => {
    const fd = new FormData();
    mockApi.post.mockResolvedValue({ logoUrl: 'https://example.com/new-logo.png' });
    await brandingService.uploadLogo(fd);
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/branding/logo', fd);
  });

  it('deleteLogo() calls DELETE /branding/logo', async () => {
    mockApi.delete.mockResolvedValue(undefined);
    await brandingService.deleteLogo();
    expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/branding/logo');
  });

  it('uploadPhoto() calls POST /branding/photo', async () => {
    const fd = new FormData();
    mockApi.post.mockResolvedValue({ photoUrl: 'https://example.com/photo.png' });
    await brandingService.uploadPhoto(fd);
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/branding/photo', fd);
  });

  it('deletePhoto() calls DELETE /branding/photo', async () => {
    mockApi.delete.mockResolvedValue(undefined);
    await brandingService.deletePhoto();
    expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/branding/photo');
  });
});

describe('Branding Store', () => {
  // M9-01: Fetch current branding
  it('M9-01: fetchBranding() populates branding', async () => {
    mockApi.get.mockResolvedValue(fakeBranding);
    await useBrandingStore.getState().fetchBranding();
    expect(useBrandingStore.getState().branding?.primaryColor).toBe('#C8102E');
  });

  // M9-02: Update branding
  it('M9-02: updateBranding() updates state', async () => {
    mockApi.patch.mockResolvedValue({ ...fakeBranding, tagline: 'Updated' });
    await useBrandingStore.getState().updateBranding({ tagline: 'Updated' });
    expect(useBrandingStore.getState().branding?.tagline).toBe('Updated');
  });

  // M9-03: Upload logo
  it('M9-03: uploadLogo() updates logoUrl', async () => {
    useBrandingStore.setState({ branding: fakeBranding });
    mockApi.post.mockResolvedValue({ logoUrl: 'https://example.com/new-logo.png' });
    await useBrandingStore.getState().uploadLogo(new FormData());
    expect(useBrandingStore.getState().branding?.logoUrl).toBe('https://example.com/new-logo.png');
  });

  // M9-04: Upload photo
  it('M9-04: uploadPhoto() updates photoUrl', async () => {
    useBrandingStore.setState({ branding: fakeBranding });
    mockApi.post.mockResolvedValue({ photoUrl: 'https://example.com/photo.png' });
    await useBrandingStore.getState().uploadPhoto(new FormData());
    expect(useBrandingStore.getState().branding?.photoUrl).toBe('https://example.com/photo.png');
  });

  // M9-05: Delete logo
  it('M9-05: deleteLogo() clears logoUrl', async () => {
    useBrandingStore.setState({ branding: fakeBranding });
    mockApi.delete.mockResolvedValue(undefined);
    await useBrandingStore.getState().deleteLogo();
    expect(useBrandingStore.getState().branding?.logoUrl).toBeNull();
  });

  // M9-06: Preview branding (URL helper)
  it('M9-06: getPreviewUrl() returns correct URL', async () => {
    const url = await brandingService.getPreviewUrl();
    expect(url).toBe('/api/v1/branding/preview');
  });

  it('error state on fetch failure', async () => {
    mockApi.get.mockRejectedValue(new Error('Network error'));
    await useBrandingStore.getState().fetchBranding();
    expect(useBrandingStore.getState().error).toBe('Network error');
  });
});
