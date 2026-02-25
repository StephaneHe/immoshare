/**
 * Tests for LoginScreen (screens/Auth/LoginScreen.tsx)
 * Test plan: M1-14 through M1-22
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { LoginScreen } from '../../src/screens/Auth/LoginScreen';
import { useAuthStore } from '../../src/stores/auth.store';

// Navigation mock (from jest.setup.ts)
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
} as any;

const mockRoute = { params: {} } as any;

// Mock auth store
jest.mock('../../src/stores/auth.store');
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

function setupStore(overrides = {}) {
  const defaults = {
    login: jest.fn(),
    isLoading: false,
    error: null,
    clearError: jest.fn(),
  };
  const store = { ...defaults, ...overrides };
  mockUseAuthStore.mockReturnValue(store);
  return store;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LoginScreen', () => {
  // M1-14
  it('M1-14: renders title "ImmoShare" and subtitle', () => {
    setupStore();
    render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);

    expect(screen.getByText('ImmoShare')).toBeTruthy();
    expect(screen.getByText('Share your properties, track engagement')).toBeTruthy();
  });

  // M1-15
  it('M1-15: renders email and password fields', () => {
    setupStore();
    render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);

    expect(screen.getByPlaceholderText('Email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();
  });

  // M1-16
  it('M1-16: renders "Sign In" button', () => {
    setupStore();
    render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);

    expect(screen.getByText('Sign In')).toBeTruthy();
  });

  // M1-17
  it('M1-17: Sign In button shows loading text while loading', () => {
    setupStore({ isLoading: true });
    render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);

    expect(screen.getByText('Signing in...')).toBeTruthy();
  });

  // M1-18
  it('M1-18: tap Sign In calls login(email, password)', () => {
    const store = setupStore();
    render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'user@test.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'mypassword');
    fireEvent.press(screen.getByText('Sign In'));

    expect(store.login).toHaveBeenCalledWith('user@test.com', 'mypassword');
  });

  // M1-19
  it('M1-19: displays error message on login failure', () => {
    setupStore({ error: 'Invalid credentials' });
    render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);

    expect(screen.getByText('Invalid credentials')).toBeTruthy();
  });

  // M1-20
  it('M1-20: typing in fields calls clearError', () => {
    const store = setupStore({ error: 'Some error' });
    render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'a');
    expect(store.clearError).toHaveBeenCalled();
  });

  // M1-21
  it('M1-21: tap "Sign Up" navigates to Register', () => {
    setupStore();
    render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);

    fireEvent.press(screen.getByText('Sign Up'));
    expect(mockNavigate).toHaveBeenCalledWith('Register');
  });

  // M1-22
  it('M1-22: tap "Forgot password?" navigates to ForgotPassword', () => {
    setupStore();
    render(<LoginScreen navigation={mockNavigation} route={mockRoute} />);

    fireEvent.press(screen.getByText('Forgot password?'));
    expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
  });
});
