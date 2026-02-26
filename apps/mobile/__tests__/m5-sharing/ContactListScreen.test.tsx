/**
 * ContactListScreen — rendering test (M5)
 */
import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('../../src/stores/contact.store', () => ({
  useContactStore: () => ({
    contacts: [], total: 0, isLoading: false, error: null, search: '',
    fetchContacts: jest.fn(), setSearch: jest.fn(), deleteContact: jest.fn(),
  }),
}));

import { ContactListScreen } from '../../src/screens/Share/ContactListScreen';

const navProps = {
  navigation: { navigate: jest.fn(), goBack: jest.fn() } as any,
  route: { params: {}, key: 'ContactList', name: 'ContactList' } as any,
};

describe('ContactListScreen', () => {
  it('renders search input', () => {
    const { getByPlaceholderText } = render(<ContactListScreen {...navProps} />);
    expect(getByPlaceholderText('Search contacts...')).toBeTruthy();
  });

  it('renders empty state when no contacts', () => {
    const { getByText } = render(<ContactListScreen {...navProps} />);
    expect(getByText('No contacts yet')).toBeTruthy();
    expect(getByText('Add contacts to share properties')).toBeTruthy();
  });

  it('renders contact count', () => {
    const { getByText } = render(<ContactListScreen {...navProps} />);
    expect(getByText('0 contacts')).toBeTruthy();
  });

  it('renders FAB button', () => {
    const { getByText } = render(<ContactListScreen {...navProps} />);
    expect(getByText('+')).toBeTruthy();
  });
});
