/**
 * ImmoShare design tokens
 */
export const colors = {
  primary: '#2563EB',     // Blue 600
  primaryDark: '#1D4ED8', // Blue 700
  primaryLight: '#DBEAFE', // Blue 100
  secondary: '#059669',   // Emerald 600
  background: '#F9FAFB',  // Gray 50
  surface: '#FFFFFF',
  text: '#111827',        // Gray 900
  textSecondary: '#6B7280', // Gray 500
  textLight: '#9CA3AF',   // Gray 400
  border: '#E5E7EB',      // Gray 200
  error: '#DC2626',       // Red 600
  errorLight: '#FEF2F2',  // Red 50
  success: '#059669',     // Emerald 600
  successLight: '#ECFDF5', // Emerald 50
  warning: '#D97706',     // Amber 600
  warningLight: '#FFFBEB', // Amber 50
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;
