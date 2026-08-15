/**
 * ContactCreateScreen — add-contact form + create flow (M5)
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

const mockCreateContact = jest.fn();
jest.mock('../../src/stores/contact.store', () => ({
  useContactStore: () => ({ createContact: mockCreateContact }),
}));

import { ContactCreateScreen } from '../../src/screens/Share/ContactCreateScreen';

const makeProps = () => ({
  navigation: { navigate: jest.fn(), goBack: jest.fn() } as any,
  route: { params: {}, key: 'ContactCreate', name: 'ContactCreate' } as any,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockCreateContact.mockResolvedValue({ id: 'c1', name: 'Jane Doe' });
});

describe('ContactCreateScreen', () => {
  it('renders the form fields and submit button', () => {
    const { getByText, getByPlaceholderText } = render(<ContactCreateScreen {...makeProps()} />);
    expect(getByText('Name *')).toBeTruthy();
    expect(getByPlaceholderText('Full name')).toBeTruthy();
    expect(getByPlaceholderText('name@example.com')).toBeTruthy();
    expect(getByPlaceholderText('Phone number')).toBeTruthy();
    expect(getByPlaceholderText('Company')).toBeTruthy();
    expect(getByText('Add Contact')).toBeTruthy();
  });

  it('requires a name — shows error and does not call create', () => {
    const { getByText } = render(<ContactCreateScreen {...makeProps()} />);
    fireEvent.press(getByText('Add Contact'));
    expect(getByText('Name is required')).toBeTruthy();
    expect(mockCreateContact).not.toHaveBeenCalled();
  });

  it('submits trimmed data and navigates back on success', async () => {
    const props = makeProps();
    const { getByText, getByPlaceholderText } = render(<ContactCreateScreen {...props} />);
    fireEvent.changeText(getByPlaceholderText('Full name'), '  Jane Doe  ');
    fireEvent.changeText(getByPlaceholderText('name@example.com'), 'jane@example.com');
    fireEvent.changeText(getByPlaceholderText('Phone number'), '+972 50 000 0000');
    fireEvent.press(getByText('Add Contact'));
    await waitFor(() =>
      expect(mockCreateContact).toHaveBeenCalledWith({
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+972 50 000 0000',
      }),
    );
    await waitFor(() => expect(props.navigation.goBack).toHaveBeenCalled());
  });

  it('omits empty optional fields when submitting', async () => {
    const { getByText, getByPlaceholderText } = render(<ContactCreateScreen {...makeProps()} />);
    fireEvent.changeText(getByPlaceholderText('Full name'), 'Solo');
    fireEvent.press(getByText('Add Contact'));
    await waitFor(() => expect(mockCreateContact).toHaveBeenCalledWith({ name: 'Solo' }));
  });

  it('shows an error and stays on the screen when creation fails', async () => {
    mockCreateContact.mockRejectedValueOnce(new Error('Network down'));
    const props = makeProps();
    const { getByText, getByPlaceholderText } = render(<ContactCreateScreen {...props} />);
    fireEvent.changeText(getByPlaceholderText('Full name'), 'Jane');
    fireEvent.press(getByText('Add Contact'));
    await waitFor(() => expect(getByText('Network down')).toBeTruthy());
    expect(props.navigation.goBack).not.toHaveBeenCalled();
  });
});
