/**
 * Institutional Accessibility Kiosk — Design Token System
 *
 * Visual language: public-sector digital service + premium accessibility hardware.
 * Target contexts: government service counters, hospitals, banks, universities,
 * railway offices.
 *
 * Palette principles:
 *   — Deep navy as the primary institutional anchor
 *   — Warm off-white background (not pure white) for reduced eye strain
 *   — Charcoal text for comfortable readability
 *   — Muted blue-gray for secondary information
 *   — Restrained teal for active states and accessibility indicators
 *   — Very subtle borders, no heavy shadows
 */

// ── Colours ──────────────────────────────────────────────────────────────────

export const AccessColors = {
  // Main page background — warm off-white
  background: '#F5F4F1',

  // Card/surface backgrounds
  cardDefault: '#FFFFFF',
  cardHover: '#F9F8F6',
  cardSelected: '#EBF5F2',

  // Institutional navy — header, primary actions
  navy: '#1B2D4F',
  navyHover: '#243B67',

  // Text hierarchy
  textPrimary: '#1F2A37',       // near-charcoal for all body text
  textSecondary: '#6B7A99',     // blue-gray for descriptive copy
  textTertiary: '#9AA3B8',      // light labels, timestamps
  textOnDark: '#FFFFFF',        // text on navy surfaces
  textOnDarkMuted: '#A8B8D0',   // secondary text on navy surfaces

  // Teal accent — selected state, active indicators
  teal: '#0B7B69',
  tealDark: '#096557',
  tealBorder: '#0B7B69',

  // Borders
  border: '#D1D5DB',           // default card border
  borderLight: '#E9EAED',      // very subtle dividers
  borderHover: '#A8B4C8',      // hovered card border
  borderActive: '#0B7B69',     // selected / active border

  // Focus ring — high visibility for keyboard users
  focusRing: '#1B2D4F',

  // Service status indicator
  statusGreen: '#2D7D46',
  statusGreenBg: '#E6F4EB',

  // Divider lines
  divider: '#E4E5E9',

  // Header chrome
  headerBg: '#1B2D4F',
  headerBorder: 'rgba(255,255,255,0.10)',

  // Overlay / scrim
  overlay: 'rgba(27, 45, 79, 0.06)',
} as const;

// ── Spacing — 8px base grid ────────────────────────────────────────────────

export const AccessSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// ── Border Radius ─────────────────────────────────────────────────────────

export const AccessRadius = {
  sm: 6,
  md: 10,    // mode cards
  lg: 14,
  xl: 20,
} as const;

// ── Typography ────────────────────────────────────────────────────────────

export const AccessFontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 18,
  lg: 22,
  xl: 28,
  xxl: 36,
  hero: 44,
} as const;

export const AccessFontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// ── Animation ──────────────────────────────────────────────────────────────

export const AccessAnimation = {
  /** Standard micro-interaction: 150ms */
  fast: 150,
  /** Standard page transition: 200ms */
  standard: 200,
  /** Deliberate transition: 250ms */
  slow: 250,
} as const;
