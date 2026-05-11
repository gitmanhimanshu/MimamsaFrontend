// Mimamsa Theme Constants - Aligned with Web App
// Light orange theme matching MimamsaWeb Tailwind config

export const COLORS = {
  // Primary - Orange (matching web primary: #FF7700)
  primary: '#FF7700',
  primaryDark: '#E56A00',
  primaryLight: '#FF9933',

  // Background
  background: '#FFF5E6',
  surface: '#FFFFFF',
  card: '#FFFFFF',

  // Text
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',

  // Accent
  accent: '#FF9933',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',

  // Neutral
  white: '#ffffff',
  black: '#000000',
  border: '#fed7aa',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  }
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
  },
  caption: {
    fontSize: 14,
    fontWeight: '500',
  },
  small: {
    fontSize: 12,
    fontWeight: '400',
  },
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
