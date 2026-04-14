/**
 * Application constants
 */

export const APP_NAME = 'SECat';
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
  // Defaults: text - black, component - #3DCD58, background - white
  BACKGROUND: '#ffffff', // white
  COMPONENT: '#3DCD58', // primary component color
  TEXT_PRIMARY: '#000000', // black
  BORDER: '#e5e7eb', // light border
  TEXT_SECONDARY: '#6b7280', // gray-500
} as const;

export const SUPPORTED_FILE_TYPES = ['pdf', 'docx', 'doc', 'txt', 'pptx', 'xlsx'];
export const MAX_FILE_SIZE_MB = 50; // 50MB max file size

export const FONT = {
  DEFAULT: 'Special Gothic', // default font style
} as const;
