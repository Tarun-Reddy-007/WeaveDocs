/**
 * Application constants
 */

export const APP_NAME = 'WeaveDocs';
export const APP_TAGLINE = 'Turn static documents into seamless web experiences';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  PRIVACY: '/privacy',
  TERMS: '/terms',
} as const;

export const UI = {
  NAVBAR_HEIGHT: '64px', // h-16
  FOOTER_HEIGHT: 'auto',
  CONTAINER_MAX_WIDTH: '1280px', // max-w-7xl
} as const;

export const SPACING = {
  XS: '4px', // p-1
  SM: '8px', // p-2
  MD: '16px', // p-4
  LG: '24px', // p-6
  XL: '32px', // p-8
} as const;

export const COLORS = {
  BACKGROUND: '#0f172a', // neutral-950
  FOREGROUND: '#e5e7eb', // neutral-200
  BORDER: '#1f2937', // neutral-800
  TEXT_PRIMARY: '#f5f5f5', // neutral-100
  TEXT_SECONDARY: '#d1d5db', // neutral-300
  TEXT_TERTIARY: '#9ca3af', // neutral-400
} as const;

export const SUPPORTED_FILE_TYPES = ['pdf', 'docx', 'doc', 'txt', 'pptx', 'xlsx'];
export const MAX_FILE_SIZE_MB = 50; // 50MB max file size
