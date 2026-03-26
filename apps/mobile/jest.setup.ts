/**
 * Jest setup file for ImmoShare mobile app.
 * Mocks native modules that don't work in the Jest/JSDOM environment.
 *
 * The TurboModuleRegistry mock is required for RN 0.74+ because the new
 * codegen specs (NativeDeviceInfo, NativePlatformConstants, etc.) use
 * TurboModuleRegistry.getEnforcing() which returns null in test env.
 */

// --- TurboModuleRegistry mock (fully synthetic, no requireActual) ---
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => {
  const mockModules: Record<string, unknown> = {
    DeviceInfo: {
      getConstants: () => ({
        Dimensions: {
          window: { width: 390, height: 844, scale: 2, fontScale: 1 },
          screen: { width: 390, height: 844, scale: 2, fontScale: 1 },
        },
      }),
    },
    PlatformConstants: {
      getConstants: () => ({
        isTesting: true,
        reactNativeVersion: { major: 0, minor: 74, patch: 5 },
        forceTouchAvailable: false,
        osVersion: 14,
        interfaceIdiom: 'phone',
      }),
    },
    I18nManager: {
      getConstants: () => ({
        isRTL: false,
        doLeftAndRightSwapInRTL: true,
        localeIdentifier: 'en_US',
      }),
    },
    SourceCode: {
      getConstants: () => ({
        scriptURL: 'http://localhost:8081/index.bundle',
      }),
    },
    Appearance: {
      getColorScheme: () => 'light',
      addListener: jest.fn(),
      removeListeners: jest.fn(),
    },
    StatusBarManager: {
      getConstants: () => ({
        HEIGHT: 44,
        DEFAULT_BACKGROUND_COLOR: 0,
      }),
      getHeight: jest.fn((cb: (h: { height: number }) => void) => cb({ height: 44 })),
      setStyle: jest.fn(),
      setHidden: jest.fn(),
      setNetworkActivityIndicatorVisible: jest.fn(),
    },
    Networking: {
      addListener: jest.fn(),
      removeListeners: jest.fn(),
      sendRequest: jest.fn(),
      abortRequest: jest.fn(),
      clearCookies: jest.fn(),
    },
  };

  // Default mock for any unknown module
  const defaultMock = {
    getConstants: () => ({}),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  };

  return {
    getEnforcing: (name: string) => mockModules[name] || defaultMock,
    get: (name: string) => mockModules[name] || null,
  };
});

// --- expo-secure-store mock ---
jest.mock('expo-secure-store', () => {
  const store: Record<string, string> = {};
  return {
    getItemAsync: jest.fn(async (key: string) => store[key] ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      delete store[key];
    }),
    __store: store,
    __reset: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
});

// --- @react-navigation mocks ---
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockReset = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
      reset: mockReset,
      dispatch: jest.fn(),
      setOptions: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
    useFocusEffect: jest.fn(),
    useIsFocused: jest.fn(() => true),
  };
});

// --- NativeEventEmitter mock (required for RN 0.76+ Keyboard) ---
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
  return jest.fn().mockImplementation(() => ({
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    removeAllListeners: jest.fn(),
    removeSubscription: jest.fn(),
    listeners: jest.fn(() => []),
    emit: jest.fn(),
  }));
});

// --- Global fetch mock ---
global.fetch = jest.fn();

// --- Export navigation mocks for test assertions ---
export { mockNavigate, mockGoBack, mockReset };
