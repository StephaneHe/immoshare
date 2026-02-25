/**
 * Tests for ForgotPasswordScreen (screens/Auth/ForgotPasswordScreen.tsx)
 * Test plan: M1-30 through M1-34
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ForgotPasswordScreen } from '../../src/screens/Auth/ForgotPasswordScreen';
import { api } from '../../src/services/api';

// Mock api
jest.mock('../../src/services/api', () => ({
  api: {
    post: jest.fn(),
  },
  ApiError: jest.requireActual('../../src/services/api').ApiError,
}));

const mockApi = api as jest.Mocked<typeof api>;

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
  dispatch: jest.fn(),
  setOptions: jest.fn(),
} as any;

const mockRoute = { params: {} } as any;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ForgotPasswordScreen', () => {
  // M1-30
  it('M1-30: renders "Reset Password" title', () => {
    render(<ForgotPasswordScreen navigation={mockNavigation} route={mockRoute} />);

    expect(screen.getByText('Reset Password')).toBeTruthy();
  });

  // M1-31
  it('M1-31: renders email field and "Send Reset Link" button', () => {
    render(<ForgotPasswordScreen navigation={mockNavigation} route={mockRoute} />);

    expect(screen.getByPlaceholderText('Email')).toBeTruthy();
    expect(screen.getByText('Send Reset Link')).toBeTruthy();
  });

  // M1-32
  it('M1-32: tap "Send Reset Link" calls forgot-password API', async () => {
    mockApi.post.mockResolvedValue(undefined);
    render(<ForgotPasswordScreen navigation={mockNavigation} route={mockRoute} />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'test@test.com');
    fireEvent.press(screen.getByText('Send Reset Link'));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        '/api/v1/auth/forgot-password',
        { email: 'test@test.com' },
        { skipAuth: true },
      );
    });
  });

  // M1-33
  it('M1-33: shows success confirmation after sending', async () => {
    mockApi.post.mockResolvedValue(undefined);
    render(<ForgotPasswordScreen navigation={mockNavigation} route={mockRoute} />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'test@test.com');
    fireEvent.press(screen.getByText('Send Reset Link'));

    await waitFor(() => {
      expect(screen.getByText('Check your email')).toBeTruthy();
    });
  });

  // M1-34
  it('M1-34: tap "Back to Sign In" navigates to Login (before sending)', () => {
    render(<ForgotPasswordScreen navigation={mockNavigation} route={mockRoute} />);

    fireEvent.press(screen.getByText('Back to Sign In'));
    expect(mockGoBack).toHaveBeenCalled();
  });
});
