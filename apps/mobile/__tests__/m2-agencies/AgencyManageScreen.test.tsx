/**
 * Tests for AgencyManageScreen (M2 — Profile stack)
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
    getById: jest.fn(),
    create: jest.fn(),
  },
}));

const mockNavigate = jest.fn();
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockGetById = agencyService.getById as jest.Mock;
const mockCreate = agencyService.create as jest.Mock;

import { AgencyManageScreen } from '../../src/screens/Profile/AgencyManageScreen';

const fakeAuthState = {
  user: { id: 'u1', email: 'a@b.com', name: 'Test', agencyId: null } as any,
  isLoading: false, isAuthenticated: true, error: null,
  init: jest.fn(), login: jest.fn(), register: jest.fn(), logout: jest.fn(), clearError: jest.fn(),
};

const fakeAgency = {
  id: 'ag1', name: 'Best Realty', address: '123 Main St', phone: '+972501234567', email: 'info@best.com',
};

const renderScreen = () =>
  render(
    <AgencyManageScreen
      navigation={{ navigate: mockNavigate } as any}
      route={{ key: 'test', name: 'AgencyManage' } as any}
    />
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuthStore.mockReturnValue(fakeAuthState);
});

describe('AgencyManageScreen — no agency', () => {
  it('renders create form when user has no agency', async () => {
    const { findByText } = renderScreen();
    expect(await findByText('Create Your Agency')).toBeTruthy();
  });

  it('renders agency name input', async () => {
    const { findByPlaceholderText } = renderScreen();
    expect(await findByPlaceholderText('Agency Name')).toBeTruthy();
  });

  it('renders Create Agency button', async () => {
    const { findByText } = renderScreen();
    expect(await findByText('Create Agency')).toBeTruthy();
  });

  it('calls agencyService.create on submit', async () => {
    mockCreate.mockResolvedValueOnce(fakeAgency);
    const { findByPlaceholderText, findByText } = renderScreen();
    const input = await findByPlaceholderText('Agency Name');
    fireEvent.changeText(input, 'Best Realty');
    const button = await findByText('Create Agency');
    fireEvent.press(button);
    await waitFor(() => expect(mockCreate).toHaveBeenCalledWith({ name: 'Best Realty' }));
  });
});

describe('AgencyManageScreen — with agency', () => {
  beforeEach(() => {
    mockUseAuthStore.mockReturnValue({
      ...fakeAuthState,
      user: { ...fakeAuthState.user, agencyId: 'ag1' } as any,
    });
    mockGetById.mockResolvedValue(fakeAgency);
  });

  it('renders agency name after loading', async () => {
    const { findByText } = renderScreen();
    expect(await findByText('Best Realty')).toBeTruthy();
  });

  it('renders agency address', async () => {
    const { findByText } = renderScreen();
    expect(await findByText('123 Main St')).toBeTruthy();
  });

  it('renders Team Members menu item', async () => {
    const { findByText } = renderScreen();
    expect(await findByText('Team Members')).toBeTruthy();
  });

  it('tap Team Members navigates to AgencyMembers', async () => {
    const { findByText } = renderScreen();
    const item = await findByText('Team Members');
    fireEvent.press(item);
    expect(mockNavigate).toHaveBeenCalledWith('AgencyMembers');
  });
});
