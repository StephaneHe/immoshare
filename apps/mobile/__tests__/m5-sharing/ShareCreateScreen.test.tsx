/**
 * Tests for ShareCreateScreen (M5 — Share stack)
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';

const mockFetchContacts = jest.fn();
const fakeContacts = [
  { id: 'c1', name: 'Alice Levi', email: 'alice@test.com', phone: null, company: null, notes: null },
  { id: 'c2', name: 'Bob Katz', email: 'bob@test.com', phone: '+972509999999', company: null, notes: null },
];

jest.mock('../../src/stores/contact.store', () => ({
  useContactStore: () => ({
    contacts: fakeContacts,
    isLoading: false,
    fetchContacts: mockFetchContacts,
  }),
}));

jest.mock('../../src/services/share.service', () => ({
  shareService: { createBatch: jest.fn() },
}));

import { ShareCreateScreen } from '../../src/screens/Share/ShareCreateScreen';

const mockGoBack = jest.fn();

const renderScreen = (pageId?: string) =>
  render(
    <ShareCreateScreen
      route={{ key: 'test', name: 'ShareCreate', params: { pageId } } as any}
      navigation={{ goBack: mockGoBack } as any}
    />
  );

beforeEach(() => jest.clearAllMocks());

describe('ShareCreateScreen', () => {
  it('renders Channels section', () => {
    const { getByText } = renderScreen('page1');
    expect(getByText('Channels')).toBeTruthy();
  });

  it('renders all 3 channel options', () => {
    const { getByText } = renderScreen('page1');
    expect(getByText('WhatsApp')).toBeTruthy();
    expect(getByText('Email')).toBeTruthy();
    expect(getByText('SMS')).toBeTruthy();
  });

  it('renders contacts section with count', () => {
    const { getByText } = renderScreen('page1');
    expect(getByText('Contacts (0 selected)')).toBeTruthy();
  });

  it('renders contact names', () => {
    const { getByText } = renderScreen('page1');
    expect(getByText('Alice Levi')).toBeTruthy();
    expect(getByText('Bob Katz')).toBeTruthy();
  });

  it('renders send button', () => {
    const { getByText } = renderScreen('page1');
    expect(getByText('Share with 0 contacts')).toBeTruthy();
  });

  it('updates selected count when contact is tapped', () => {
    const { getByText } = renderScreen('page1');
    fireEvent.press(getByText('Alice Levi'));
    expect(getByText('Contacts (1 selected)')).toBeTruthy();
    expect(getByText('Share with 1 contact')).toBeTruthy();
  });

  it('shows alert when sending without contacts selected', () => {
    const spy = jest.spyOn(Alert, 'alert');
    const { getByText } = renderScreen('page1');
    fireEvent.press(getByText('Share with 0 contacts'));
    expect(spy).toHaveBeenCalledWith('Error', 'Select at least one contact');
    spy.mockRestore();
  });

  it('shows alert when no pageId provided', () => {
    const spy = jest.spyOn(Alert, 'alert');
    const { getByText } = renderScreen(undefined);
    fireEvent.press(getByText('Alice Levi'));
    fireEvent.press(getByText('Share with 1 contact'));
    expect(spy).toHaveBeenCalledWith('Error', 'No page selected. Please share from a property page.');
    spy.mockRestore();
  });

  it('calls fetchContacts on mount', () => {
    renderScreen('page1');
    expect(mockFetchContacts).toHaveBeenCalled();
  });
});
