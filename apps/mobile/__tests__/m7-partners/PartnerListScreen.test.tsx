/**
 * Tests for PartnerListScreen (M7 — Profile stack)
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

const mockFetchPartners = jest.fn();
const mockCreateInvite = jest.fn();
const mockRemovePartner = jest.fn();

const fakePartners = [
  { inviteId: 'inv1', partnerId: 'p1', partnerName: 'Sarah Cohen', partnerEmail: 'sarah@realty.com', since: '2026-01-15T00:00:00Z' },
  { inviteId: 'inv2', partnerId: 'p2', partnerName: 'David Levi', partnerEmail: 'david@homes.com', since: '2026-02-20T00:00:00Z' },
];

jest.mock('../../src/stores/partner.store', () => ({
  usePartnerStore: () => ({
    partners: fakePartners,
    isLoading: false,
    error: null,
    fetchPartners: mockFetchPartners,
    createInvite: mockCreateInvite,
    removePartner: mockRemovePartner,
  }),
}));

import { PartnerListScreen } from '../../src/screens/Profile/PartnerListScreen';

beforeEach(() => jest.clearAllMocks());

describe('PartnerListScreen', () => {
  it('renders partner names', () => {
    const { getByText } = render(<PartnerListScreen />);
    expect(getByText('Sarah Cohen')).toBeTruthy();
    expect(getByText('David Levi')).toBeTruthy();
  });

  it('renders partner emails', () => {
    const { getByText } = render(<PartnerListScreen />);
    expect(getByText('sarah@realty.com')).toBeTruthy();
    expect(getByText('david@homes.com')).toBeTruthy();
  });

  it('renders partner initials as avatar', () => {
    const { getByText } = render(<PartnerListScreen />);
    expect(getByText('S')).toBeTruthy();
    expect(getByText('D')).toBeTruthy();
  });

  it('renders "Partner since" dates', () => {
    const { getAllByText } = render(<PartnerListScreen />);
    const sinceTexts = getAllByText(/Partner since/);
    expect(sinceTexts.length).toBe(2);
  });

  it('renders FAB button', () => {
    const { getByText } = render(<PartnerListScreen />);
    expect(getByText('+')).toBeTruthy();
  });

  it('calls fetchPartners on mount', () => {
    render(<PartnerListScreen />);
    expect(mockFetchPartners).toHaveBeenCalled();
  });
});

describe('PartnerListScreen — empty state', () => {
  it('renders empty state when no partners', () => {
    // Override fakePartners to empty for this test
    fakePartners.length = 0;
    const { getByText } = render(<PartnerListScreen />);
    expect(getByText('No partners yet')).toBeTruthy();
    expect(getByText('Invite other agents to collaborate')).toBeTruthy();
    // Restore
    fakePartners.push(
      { inviteId: 'inv1', partnerId: 'p1', partnerName: 'Sarah Cohen', partnerEmail: 'sarah@realty.com', since: '2026-01-15T00:00:00Z' },
      { inviteId: 'inv2', partnerId: 'p2', partnerName: 'David Levi', partnerEmail: 'david@homes.com', since: '2026-02-20T00:00:00Z' },
    );
  });
});
