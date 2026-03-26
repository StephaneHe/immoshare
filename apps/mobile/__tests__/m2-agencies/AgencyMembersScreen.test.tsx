/**
 * Tests for AgencyMembersScreen (M2 — Profile stack)
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useAuthStore } from '../../src/stores/auth.store';
import { agencyService } from '../../src/services/agency.service';

jest.mock('../../src/stores/auth.store', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('../../src/services/agency.service', () => ({
  agencyService: {
    listMembers: jest.fn(),
    listInvites: jest.fn(),
    createInvite: jest.fn(),
    removeMember: jest.fn(),
  },
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockListMembers = agencyService.listMembers as jest.Mock;
const mockListInvites = agencyService.listInvites as jest.Mock;
const mockCreateInvite = agencyService.createInvite as jest.Mock;

import { AgencyMembersScreen } from '../../src/screens/Profile/AgencyMembersScreen';

const fakeMembers = [
  { id: 'm1', name: 'Alice Smith', email: 'alice@test.com', role: 'admin' },
  { id: 'm2', name: 'Bob Jones', email: 'bob@test.com', role: 'agent' },
];

const fakeInvites = [
  { id: 'i1', email: 'new@test.com', status: 'pending' },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuthStore.mockReturnValue({
    user: { id: 'u1', agencyId: 'ag1' } as any,
    isLoading: false, isAuthenticated: true, error: null,
    init: jest.fn(), login: jest.fn(), register: jest.fn(), logout: jest.fn(), clearError: jest.fn(),
  });
  mockListMembers.mockResolvedValue(fakeMembers);
  mockListInvites.mockResolvedValue(fakeInvites);
});

describe('AgencyMembersScreen', () => {
  it('renders invite input', async () => {
    const { findByPlaceholderText } = render(<AgencyMembersScreen />);
    expect(await findByPlaceholderText('Email to invite...')).toBeTruthy();
  });

  it('renders invite button', async () => {
    const { findByText } = render(<AgencyMembersScreen />);
    expect(await findByText('Invite')).toBeTruthy();
  });

  it('renders member names after loading', async () => {
    const { findByText } = render(<AgencyMembersScreen />);
    expect(await findByText('Alice Smith')).toBeTruthy();
    expect(await findByText('Bob Jones')).toBeTruthy();
  });

  it('renders member emails', async () => {
    const { findByText } = render(<AgencyMembersScreen />);
    expect(await findByText('alice@test.com')).toBeTruthy();
    expect(await findByText('bob@test.com')).toBeTruthy();
  });

  it('renders member roles', async () => {
    const { findByText } = render(<AgencyMembersScreen />);
    expect(await findByText('admin')).toBeTruthy();
    expect(await findByText('agent')).toBeTruthy();
  });

  it('renders member count header', async () => {
    const { findByText } = render(<AgencyMembersScreen />);
    expect(await findByText('2 Members')).toBeTruthy();
  });

  it('renders pending invites section', async () => {
    const { findByText } = render(<AgencyMembersScreen />);
    expect(await findByText('Pending Invites')).toBeTruthy();
    expect(await findByText('new@test.com')).toBeTruthy();
  });

  it('calls createInvite on invite button press', async () => {
    mockCreateInvite.mockResolvedValueOnce({ id: 'i2', email: 'x@t.com', status: 'pending' });
    const { findByPlaceholderText, findByText } = render(<AgencyMembersScreen />);
    const input = await findByPlaceholderText('Email to invite...');
    fireEvent.changeText(input, 'x@t.com');
    const button = await findByText('Invite');
    fireEvent.press(button);
    await waitFor(() => expect(mockCreateInvite).toHaveBeenCalledWith('ag1', 'x@t.com'));
  });

  it('renders member initials as avatar', async () => {
    const { findByText } = render(<AgencyMembersScreen />);
    expect(await findByText('A')).toBeTruthy();
    expect(await findByText('B')).toBeTruthy();
  });
});
