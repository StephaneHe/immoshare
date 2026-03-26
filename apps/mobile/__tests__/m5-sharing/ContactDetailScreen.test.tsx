/**
 * Tests for ContactDetailScreen (M5 — Share stack)
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { contactService } from '../../src/services/contact.service';

jest.mock('../../src/services/contact.service', () => ({
  contactService: {
    getById: jest.fn(),
    update: jest.fn(),
  },
}));

const mockGetById = contactService.getById as jest.Mock;
const mockUpdate = contactService.update as jest.Mock;
const mockGoBack = jest.fn();

import { ContactDetailScreen } from '../../src/screens/Share/ContactDetailScreen';

const fakeContact = {
  id: 'c1', name: 'Sarah Cohen', email: 'sarah@test.com',
  phone: '+972501234567', company: 'Best Realty', notes: 'VIP client',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetById.mockResolvedValue(fakeContact);
});

const renderScreen = () =>
  render(
    <ContactDetailScreen
      route={{ key: 'test', name: 'ContactDetail', params: { id: 'c1' } } as any}
      navigation={{ goBack: mockGoBack } as any}
    />
  );

describe('ContactDetailScreen — view mode', () => {
  it('renders contact name', async () => {
    const { findByText } = renderScreen();
    expect(await findByText('Sarah Cohen')).toBeTruthy();
  });

  it('renders contact email', async () => {
    const { findByText } = renderScreen();
    expect(await findByText('sarah@test.com')).toBeTruthy();
  });

  it('renders contact phone', async () => {
    const { findByText } = renderScreen();
    expect(await findByText('+972501234567')).toBeTruthy();
  });

  it('renders contact company', async () => {
    const { findByText } = renderScreen();
    expect(await findByText('Best Realty')).toBeTruthy();
  });

  it('renders contact notes', async () => {
    const { findByText } = renderScreen();
    expect(await findByText('VIP client')).toBeTruthy();
  });

  it('renders avatar initial', async () => {
    const { findByText } = renderScreen();
    expect(await findByText('S')).toBeTruthy();
  });

  it('renders Edit Contact button', async () => {
    const { findByText } = renderScreen();
    expect(await findByText('Edit Contact')).toBeTruthy();
  });
});

describe('ContactDetailScreen — edit mode', () => {
  it('shows form fields after tapping Edit', async () => {
    const { findByText, findByDisplayValue } = renderScreen();
    const editBtn = await findByText('Edit Contact');
    fireEvent.press(editBtn);
    expect(await findByDisplayValue('Sarah Cohen')).toBeTruthy();
    expect(await findByDisplayValue('sarah@test.com')).toBeTruthy();
  });

  it('shows Save and Cancel buttons in edit mode', async () => {
    const { findByText } = renderScreen();
    fireEvent.press(await findByText('Edit Contact'));
    expect(await findByText('Save')).toBeTruthy();
    expect(await findByText('Cancel')).toBeTruthy();
  });

  it('Cancel returns to view mode', async () => {
    const { findByText } = renderScreen();
    fireEvent.press(await findByText('Edit Contact'));
    fireEvent.press(await findByText('Cancel'));
    expect(await findByText('Edit Contact')).toBeTruthy();
  });

  it('Save calls contactService.update', async () => {
    mockUpdate.mockResolvedValueOnce(fakeContact);
    const { findByText } = renderScreen();
    fireEvent.press(await findByText('Edit Contact'));
    fireEvent.press(await findByText('Save'));
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith('c1', expect.any(Object)));
  });
});
