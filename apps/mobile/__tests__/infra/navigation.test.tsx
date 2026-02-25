/**
 * Tests for RootNavigator and MainTabs
 * Test plan: I-11 through I-14
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { useAuthStore } from '../../src/stores/auth.store';

// Mock child navigators to avoid full navigation tree rendering
jest.mock('../../src/navigation/AuthStack', () => ({
  AuthStack: () => {
    const { Text } = require('react-native');
    return <Text>AuthStack</Text>;
  },
}));

jest.mock('../../src/navigation/MainTabs', () => ({
  MainTabs: () => {
    const { Text } = require('react-native');
    return <Text>MainTabs</Text>;
  },
}));

// Must import AFTER mocks are set up
import { RootNavigator } from '../../src/navigation/RootNavigator';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('RootNavigator', () => {
  // I-11: Shows loading spinner while isLoading is true
  it('I-11: shows loading spinner while isLoading is true', () => {
    useAuthStore.setState({ isLoading: true, isAuthenticated: false, user: null });
    const { queryByText, UNSAFE_getByType } = render(<RootNavigator />);
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    expect(queryByText('AuthStack')).toBeNull();
    expect(queryByText('MainTabs')).toBeNull();
  });

  // I-12: Shows AuthStack when not authenticated
  it('I-12: shows AuthStack when not authenticated', () => {
    useAuthStore.setState({ isLoading: false, isAuthenticated: false, user: null });
    const { getByText, queryByText } = render(<RootNavigator />);
    expect(getByText('AuthStack')).toBeTruthy();
    expect(queryByText('MainTabs')).toBeNull();
  });

  // I-13: Shows MainTabs when authenticated
  it('I-13: shows MainTabs when authenticated', () => {
    useAuthStore.setState({
      isLoading: false,
      isAuthenticated: true,
      user: { id: '1', email: 'a@b.com', name: 'Test', role: 'agent' } as any,
    });
    const { getByText, queryByText } = render(<RootNavigator />);
    expect(getByText('MainTabs')).toBeTruthy();
    expect(queryByText('AuthStack')).toBeNull();
  });
});
