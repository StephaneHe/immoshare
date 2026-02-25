/**
 * Tests for RegisterScreen (screens/Auth/RegisterScreen.tsx)
 * Test plan: M1-23 through M1-29
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { RegisterScreen } from '../../src/screens/Auth/RegisterScreen';
import { useAuthStore } from '../../src/stores/auth.store';

const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
} as any;

const mockRoute = { params: {} } as any;

jest.mock('../../src/stores/auth.store');
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

function setupStore(overrides = {}) {
  const defaults = {
    register: jest.fn(),
    isLoading: false,
    error: null,
    clearError: jest.fn(),
  };
  const store = { ...defaults, ...overrides };
  mockUseAuthStore.mockReturnValue(store);
  return store;
}

/**
 * Helper: "Create Account" appears twice — as title and as button text.
 * The button text is the last one in document order.
 */
function getCreateAccountButton() {
  const matches = screen.getAllByText('Create Account');
  return matches[matches.length - 1];
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('RegisterScreen', () => {
  // M1-23
  it('M1-23: renders "Create Account" title', () => {
    setupStore();
    render(<RegisterScreen navigation={mockNavigation} route={mockRoute} />);

    // Title and button both contain "Create Account"
    const matches = screen.getAllByText('Create Account');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  // M1-24
  it('M1-24: renders first name, last name, email, password fields', () => {
    setupStore();
    render(<RegisterScreen navigation={mockNavigation} route={mockRoute} />);

    expect(screen.getByPlaceholderText('First name')).toBeTruthy();
    expect(screen.getByPlaceholderText('Last name')).toBeTruthy();
    expect(screen.getByPlaceholderText('Email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password (min 8 characters)')).toBeTruthy();
  });

  // M1-25
  it('M1-25: Create Account button does not call register when fields empty', () => {
    const store = setupStore();
    render(<RegisterScreen navigation={mockNavigation} route={mockRoute} />);

    // Press the button (not the title)
    fireEvent.press(getCreateAccountButton());

    expect(store.register).not.toHaveBeenCalled();
  });

  // M1-26
  it('M1-26: Create Account button shows loading text while loading', () => {
    setupStore({ isLoading: true });
    render(<RegisterScreen navigation={mockNavigation} route={mockRoute} />);

    expect(screen.getByText('Creating account...')).toBeTruthy();
  });

  // M1-27
  it('M1-27: tap Create Account calls register with form data', () => {
    const store = setupStore();
    render(<RegisterScreen navigation={mockNavigation} route={mockRoute} />);

    fireEvent.changeText(screen.getByPlaceholderText('First name'), 'John');
    fireEvent.changeText(screen.getByPlaceholderText('Last name'), 'Doe');
    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'john@test.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password (min 8 characters)'), 'Password1!');
    fireEvent.press(getCreateAccountButton());

    expect(store.register).toHaveBeenCalledWith({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      password: 'Password1!',
    });
  });

  // M1-28
  it('M1-28: displays error message on registration failure', () => {
    setupStore({ error: 'Email already taken' });
    render(<RegisterScreen navigation={mockNavigation} route={mockRoute} />);

    expect(screen.getByText('Email already taken')).toBeTruthy();
  });

  // M1-29
  it('M1-29: tap "Sign In" navigates back to Login', () => {
    setupStore();
    render(<RegisterScreen navigation={mockNavigation} route={mockRoute} />);

    fireEvent.press(screen.getByText('Sign In'));
    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });
});
