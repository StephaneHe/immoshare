/**
 * BrandingEditorScreen — rendering test (M9)
 */
import React from 'react';
import { render } from '@testing-library/react-native';

const mockFetchBranding = jest.fn();
const mockUpdateBranding = jest.fn();
const mockBranding = {
  id: '1', userId: 'u1', agencyId: null,
  primaryColor: '#2563EB', accentColor: '#059669',
  fontFamily: 'Arial', tagline: 'Test tagline',
  logoUrl: null, photoUrl: null,
  createdAt: '2026-01-01', updatedAt: '2026-01-01',
};

jest.mock('../../src/stores/branding.store', () => ({
  useBrandingStore: () => ({
    branding: mockBranding,
    isLoading: false, error: null,
    fetchBranding: mockFetchBranding,
    updateBranding: mockUpdateBranding,
    uploadLogo: jest.fn(), deleteLogo: jest.fn(),
    uploadPhoto: jest.fn(), deletePhoto: jest.fn(),
  }),
}));

import { BrandingEditorScreen } from '../../src/screens/Branding/BrandingEditorScreen';

describe('BrandingEditorScreen', () => {
  it('renders color section', () => {
    const { getByText } = render(<BrandingEditorScreen />);
    expect(getByText('Colors')).toBeTruthy();
  });

  it('renders save button', () => {
    const { getByText } = render(<BrandingEditorScreen />);
    expect(getByText('Save Branding')).toBeTruthy();
  });

  it('renders typography section', () => {
    const { getByText } = render(<BrandingEditorScreen />);
    expect(getByText('Typography')).toBeTruthy();
  });

  it('renders tagline section', () => {
    const { getByText } = render(<BrandingEditorScreen />);
    expect(getByText('Tagline')).toBeTruthy();
  });

  it('renders logo section', () => {
    const { getByText } = render(<BrandingEditorScreen />);
    expect(getByText('Logo')).toBeTruthy();
  });
});
