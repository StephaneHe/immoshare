/**
 * Tests for ShareHistoryScreen (M5 — Share stack)
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { shareService } from '../../src/services/share.service';

jest.mock('../../src/services/share.service', () => ({
  shareService: { listLinks: jest.fn() },
}));

const mockListLinks = shareService.listLinks as jest.Mock;

import { ShareHistoryScreen } from '../../src/screens/Share/ShareHistoryScreen';

beforeEach(() => jest.clearAllMocks());

describe('ShareHistoryScreen — with links', () => {
  const fakeLinks = [
    { id: 'sl1', token: 'abcdef123456abcdef', channel: 'whatsapp', viewCount: 5, isActive: true, createdAt: '2026-03-01T00:00:00Z' },
    { id: 'sl2', token: 'xyz789012345xyz789', channel: 'email', viewCount: 0, isActive: false, createdAt: '2026-02-15T00:00:00Z' },
  ];

  beforeEach(() => {
    mockListLinks.mockResolvedValue({ shareLinks: fakeLinks });
  });

  it('renders share link tokens', async () => {
    const { findByText } = render(<ShareHistoryScreen />);
    expect(await findByText(/Token: abcdef123456/)).toBeTruthy();
  });

  it('renders view count', async () => {
    const { findByText } = render(<ShareHistoryScreen />);
    expect(await findByText(/5 views/)).toBeTruthy();
  });

  it('renders Active badge', async () => {
    const { findAllByText } = render(<ShareHistoryScreen />);
    const actives = await findAllByText('Active');
    expect(actives.length).toBeGreaterThan(0);
  });

  it('renders Expired badge', async () => {
    const { findByText } = render(<ShareHistoryScreen />);
    expect(await findByText('Expired')).toBeTruthy();
  });

  it('calls listLinks on mount', async () => {
    render(<ShareHistoryScreen />);
    await waitFor(() => expect(mockListLinks).toHaveBeenCalledWith({ limit: 50 }));
  });
});

describe('ShareHistoryScreen — empty', () => {
  beforeEach(() => {
    mockListLinks.mockResolvedValue({ shareLinks: [] });
  });

  it('renders empty state', async () => {
    const { findByText } = render(<ShareHistoryScreen />);
    expect(await findByText('No share links yet')).toBeTruthy();
    expect(await findByText('Share property pages to see history here')).toBeTruthy();
  });
});
