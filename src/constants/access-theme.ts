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
 *   — Vivid teal for active states and accessibility indicators
 *   — Very subtle borders, soft layered shadows
 */

// ── Colours ──────────────────────────────────────────────────────────────────

export const AccessColors = {
  // Main page background — warm off-white
  background: '#F4F3F0',

  // Card/surface backgrounds
  cardDefault: '#FFFFFF',
  cardHover: '#F8F7F5',
  cardSelected: '#E8F5F2',

  // Institutional navy — header, primary actions
  navy: '#1B2D4F',
  navyHover: '#243B67',
  navyLight: '#2D4A7A',

  // Text hierarchy
  textPrimary: '#1F2A37',       // near-charcoal for all body text
  textSecondary: '#6B7A99',     // blue-gray for descriptive copy
  textTertiary: '#9AA3B8',      // light labels, timestamps
  textOnDark: '#FFFFFF',        // text on navy surfaces
  textOnDarkMuted: '#A8B8D0',   // secondary text on navy surfaces

  // Teal accent — selected state, active indicators (vivid)
  teal: '#0EA89A',
  tealDark: '#0B8A7E',
  tealLight: '#19C9B8',
  tealBorder: '#0EA89A',
  tealFaint: '#E0F7F5',

  // Borders
  border: '#D1D5DB',           // default card border
  borderLight: '#E9EAED',      // very subtle dividers
  borderHover: '#A8B4C8',      // hovered card border
  borderActive: '#0EA89A',     // selected / active border

  // Focus ring — high visibility for keyboard users
  focusRing: '#1B2D4F',

  // Service status indicator
  statusGreen: '#16A34A',
  statusGreenBg: '#DCFCE7',
  statusGreenPulse: '#22C55E',

  // Divider lines
  divider: '#E4E5E9',

  // Header chrome
  headerBg: '#1B2D4F',
  headerBorder: 'rgba(255,255,255,0.10)',
  headerGradientStart: '#1B2D4F',
  headerGradientEnd: '#243B67',

  // Overlay / scrim
  overlay: 'rgba(27, 45, 79, 0.06)',

  // ── Institution accent colours ───────────────────────────────────────────
  // Bank — rich blue
  bankAccent: '#2563EB',
  bankAccentLight: '#EFF6FF',
  bankAccentBorder: '#93C5FD',

  // Hospital — warm rose
  hospitalAccent: '#E11D48',
  hospitalAccentLight: '#FFF1F2',
  hospitalAccentBorder: '#FECDD3',

  // Government — deep indigo
  governmentAccent: '#7C3AED',
  governmentAccentLight: '#F5F3FF',
  governmentAccentBorder: '#C4B5FD',

  // ── Mode card accent colours ─────────────────────────────────────────────
  signAccent: '#8B5CF6',       // purple
  signAccentLight: '#F5F3FF',
  voiceAccent: '#0EA89A',      // teal
  voiceAccentLight: '#E0F7F5',
  textAccent: '#F59E0B',       // amber
  textAccentLight: '#FFFBEB',
  touchAccent: '#EC4899',      // pink
  touchAccentLight: '#FDF2F8',
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
  sm: 8,
  md: 12,    // mode cards
  lg: 16,
  xl: 20,
  xl2: 24,
  full: 9999,
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

export const AccessFontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const AccessFontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// ── Shadows ────────────────────────────────────────────────────────────────

export const AccessShadow = {
  /** Subtle card lift */
  sm: {
    shadowColor: '#1B2D4F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  /** Standard card */
  md: {
    shadowColor: '#1B2D4F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 4,
  },
  /** Focused / hover */
  lg: {
    shadowColor: '#1B2D4F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.13,
    shadowRadius: 20,
    elevation: 8,
  },
  /** Teal accent glow (selected cards) */
  teal: {
    shadowColor: '#0EA89A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  /** Navy glow (active buttons) */
  navy: {
    shadowColor: '#1B2D4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

// ── Animation ──────────────────────────────────────────────────────────────

export const AccessAnimation = {
  /** Standard micro-interaction: 150ms */
  fast: 150,
  /** Standard page transition: 200ms */
  standard: 200,
  /** Deliberate transition: 250ms */
  slow: 250,
  /** Slow pulse animation: 1600ms */
  pulse: 1600,
} as const;
